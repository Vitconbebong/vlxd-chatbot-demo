using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using VLXD.Host.Auth;
using VLXD.Modules.Catalog.Domain.Entities;
using VLXD.Modules.Catalog.Infrastructure;
using VLXD.Modules.WMS.Domain.Entities;
using VLXD.Modules.WMS.Infrastructure;

namespace VLXD.Host.Data;

/// <summary>
/// Pre-populates the database with initial users, roles, categories, and products.
/// </summary>
public static class DbSeeder
{
    #region Methods

    /// <summary>
    /// Executes the seeding logic inside a scoped service boundary.
    /// </summary>
    public static async Task SeedAsync(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        
        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var catalogDb = scope.ServiceProvider.GetRequiredService<CatalogDbContext>();
        var wmsDb = scope.ServiceProvider.GetRequiredService<WmsDbContext>();
        var aiDb = scope.ServiceProvider.GetService<VLXD.Modules.AI.Infrastructure.AiDbContext>();

        await SeedRolesAsync(roleManager);
        await SeedUsersAsync(userManager);

        await SeedCatalogAsync(catalogDb);
        await SeedWmsAsync(wmsDb, catalogDb);

        // Seed Sales Customer & Draft Quotations
        var salesDb = scope.ServiceProvider.GetService<VLXD.Modules.Sales.Infrastructure.SalesDbContext>();
        if (salesDb != null)
        {
            var customerUser = await userManager.FindByEmailAsync("khach@vlxd.local");
            if (customerUser != null && Guid.TryParse(customerUser.Id, out var customerId))
            {
                var existingCustomer = await salesDb.Customers.FirstOrDefaultAsync(c => c.Id == customerId);
                if (existingCustomer == null)
                {
                    var customerEntity = new VLXD.Modules.Sales.Domain.Entities.Customer(
                        customerId,
                        "Lê Văn Khách",
                        "0909123456",
                        "khach@vlxd.local",
                        "456 Đường Nguyễn Trãi, Quận 5, TP. HCM",
                        VLXD.Modules.Sales.Domain.Enums.CustomerTier.Retail,
                        customerId
                    );
                    salesDb.Customers.Add(customerEntity);
                    await salesDb.SaveChangesAsync();
                }

                // Seed a draft quotation if none exists
                if (!await salesDb.Quotations.AnyAsync())
                {
                    var productG001 = await catalogDb.Products.FirstOrDefaultAsync(p => p.Sku == "VLXD-G001");
                    var productX001 = await catalogDb.Products.FirstOrDefaultAsync(p => p.Sku == "VLXD-X001");

                    var quotation = new VLXD.Modules.Sales.Domain.Entities.Quotation(
                        customerId,
                        "Chào bạn, tôi cần mua khoảng 50 thùng gạch Terrazzo 400x400 và 20 bao xi măng Hà Tiên PCB40 để lát vỉa hè.",
                        createdByAi: true
                    );

                    if (productG001 != null)
                    {
                        quotation.AddItem(
                            productG001.Id,
                            "50 thùng gạch Terrazzo 400x400",
                            50,
                            "Thùng",
                            productG001.BasePrice,
                            0.95m
                        );
                    }

                    if (productX001 != null)
                    {
                        quotation.AddItem(
                            productX001.Id,
                            "20 bao xi măng Hà Tiên PCB40",
                            20,
                            "Bao",
                            productX001.BasePrice,
                            0.92m
                        );
                    }

                    salesDb.Quotations.Add(quotation);
                    await salesDb.SaveChangesAsync();
                }
            }
        }

        if (aiDb != null)
        {
            await SeedAiAsync(aiDb);
        }
    }

    /// <summary>
    /// Seeds default security roles.
    /// </summary>
    private static async Task SeedRolesAsync(RoleManager<IdentityRole> roleManager)
    {
        string[] roles = { "Admin", "Employee", "Customer" };
        foreach (var role in roles)
        {
            if (!await roleManager.RoleExistsAsync(role))
            {
                await roleManager.CreateAsync(new IdentityRole(role));
            }
        }
    }

    /// <summary>
    /// Seeds default users for B2C, B2B, and internal dashboard administration.
    /// </summary>
    private static async Task SeedUsersAsync(UserManager<ApplicationUser> userManager)
    {
        // 1. Admin Account
        var adminEmail = "admin@vlxd.local";
        if (await userManager.FindByEmailAsync(adminEmail) == null)
        {
            var admin = new ApplicationUser
            {
                UserName = adminEmail,
                Email = adminEmail,
                FullName = "Nguyễn Văn Admin",
                EmailConfirmed = true
            };
            var result = await userManager.CreateAsync(admin, "Admin@123");
            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(admin, "Admin");
            }
        }

        // 2. Employee Account
        var employeeEmail = "sale@vlxd.local";
        if (await userManager.FindByEmailAsync(employeeEmail) == null)
        {
            var employee = new ApplicationUser
            {
                UserName = employeeEmail,
                Email = employeeEmail,
                FullName = "Trần Thị Sale",
                EmailConfirmed = true
            };
            var result = await userManager.CreateAsync(employee, "Sale@123");
            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(employee, "Employee");
            }
        }

        // 3. Customer Account
        var customerEmail = "khach@vlxd.local";
        if (await userManager.FindByEmailAsync(customerEmail) == null)
        {
            var customer = new ApplicationUser
            {
                UserName = customerEmail,
                Email = customerEmail,
                FullName = "Lê Văn Khách",
                CustomerTier = "Retail",
                EmailConfirmed = true
            };
            var result = await userManager.CreateAsync(customer, "Khach@123");
            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(customer, "Customer");
            }
        }
    }

    /// <summary>
    /// Seeds catalog categories and 30 products with specs, aliases, and pricing tiers.
    /// </summary>
    private static async Task SeedCatalogAsync(CatalogDbContext db)
    {
        // 1. Seed Categories
        var categories = new Dictionary<string, Category>();

        string[] categoryNames = {
            "Gạch lát & Ốp",
            "Xi măng & Vữa",
            "Cát & Đá",
            "Thép xây dựng",
            "Ống nước & Phụ kiện",
            "Sơn & Chống thấm"
        };

        for (int i = 0; i < categoryNames.Length; i++)
        {
            var name = categoryNames[i];
            var category = await db.Categories.FirstOrDefaultAsync(c => c.Name == name);
            if (category == null)
            {
                category = new Category(name, null, i + 1);
                db.Categories.Add(category);
                await db.SaveChangesAsync();
            }
            categories[name] = category;
        }

        // 2. Prepare 30 Products Data with full edge cases
        var productsData = new List<(
            string Sku,
            string Name,
            string Description,
            string CategoryName,
            decimal BasePrice,
            string UnitOfMeasure,
            decimal? UnitsPerPackage,
            decimal? CoveragePerPackage,
            decimal WastageRate,
            string[] Aliases,
            Dictionary<string, string> Specs
        )>();

        // --- Gạch lát & Ốp ---
        productsData.Add((
            "VLXD-G001",
            "Gạch Terrazzo 400x400",
            "Gạch lát vỉa hè terrazzo hoa văn hạt đá mài đẹp mắt, chịu tải cao, thoát nước tốt.",
            "Gạch lát & Ốp",
            95000,
            "Thùng",
            6,
            0.96m,
            0.05m,
            new[] { "gach terrazzo", "gach 40", "terrazzo" },
            new Dictionary<string, string> { { "Kích thước", "400x400 mm" }, { "Bề mặt", "Nhám hạt đá" }, { "Ứng dụng", "Lát sân, vỉa hè" }, { "Xuất xứ", "Việt Nam" } }
        ));

        productsData.Add((
            "VLXD-G002",
            "Gạch men ốp tường 300x600",
            "Gạch men cao cấp sáng bóng ốp tường nhà tắm, nhà bếp chống thấm nước tốt.",
            "Gạch lát & Ốp",
            145000,
            "Thùng",
            8,
            1.44m,
            0.08m,
            new[] { "gach op tuong", "gach men" },
            new Dictionary<string, string> { { "Kích thước", "300x600 mm" }, { "Bề mặt", "Bóng kính" }, { "Xuất xứ", "Việt Nam" } }
        ));

        productsData.Add((
            "VLXD-G003",
            "Gạch Mosaic thủy tinh 30x30",
            "Gạch mosaic thủy tinh cao cấp dán hồ bơi, trang trí tường nghệ thuật.",
            "Gạch lát & Ốp",
            320000,
            "Thùng",
            11,
            1.0m,
            0.15m,
            new[] { "gach mosaic", "mosaic" },
            new Dictionary<string, string> { { "Kích thước", "300x300 mm" }, { "Vật liệu", "Thủy tinh" }, { "Xuất xứ", "Trung Quốc" } }
        ));

        productsData.Add((
            "VLXD-G004",
            "Gạch granite 600x600",
            "Gạch granite đồng chất cao cấp, lát sàn phòng khách sang trọng, chống trầy xước.",
            "Gạch lát & Ốp",
            210000,
            "Thùng",
            4,
            1.44m,
            0.05m,
            new[] { "granite 60", "gach granite" },
            new Dictionary<string, string> { { "Kích thước", "600x600 mm" }, { "Bề mặt", "Bóng mờ" }, { "Xuất xứ", "Việt Nam" } }
        ));

        productsData.Add((
            "VLXD-G005",
            "Gạch bông xi măng 200x200",
            "Gạch bông xi măng thủ công cổ điển, họa tiết nghệ thuật xưa trang trí quán cafe.",
            "Gạch lát & Ốp",
            280000,
            "Thùng",
            25,
            1.0m,
            0.10m,
            new[] { "gach bong", "gach hoa van" },
            new Dictionary<string, string> { { "Kích thước", "200x200 mm" }, { "Độ dày", "16 mm" }, { "Xuất xứ", "Việt Nam" } }
        ));

        productsData.Add((
            "VLXD-G006",
            "Gạch thẻ xây 8x18",
            "Gạch tuynel 2 lỗ chịu lực tốt, cách âm cách nhiệt tốt xây tường bao quanh nhà.",
            "Gạch lát & Ốp",
            1500,
            "Viên",
            null,
            null,
            0.05m,
            new[] { "gach the", "gach xay", "gach do" },
            new Dictionary<string, string> { { "Kích thước", "80x180x80 mm" }, { "Loại gạch", "Gạch đất sét nung 2 lỗ" } }
        ));

        // --- Xi măng & Vữa ---
        productsData.Add((
            "VLXD-X001",
            "Xi măng Hà Tiên PCB40",
            "Xi măng Portland hỗn hợp PCB40 Hà Tiên dùng cho xây tô, đổ bê tông móng mái dầm.",
            "Xi măng & Vữa",
            89000,
            "Bao",
            1, // 1 bao = 50kg
            null,
            0.03m,
            new[] { "xi HT", "ximang hatien", "xm pcb40", "xi ha tien" },
            new Dictionary<string, string> { { "Cường độ nén", "PCB40" }, { "Trọng lượng", "50 kg" }, { "Xuất xứ", "Việt Nam" } }
        ));

        productsData.Add((
            "VLXD-X002",
            "Xi măng Nghi Sơn PCB40",
            "Xi măng Nghi Sơn PCB40 độ bền sunfat cao, thích hợp cho các công trình miền ven biển.",
            "Xi măng & Vữa",
            87000,
            "Bao",
            1,
            null,
            0.03m,
            new[] { "xi check", "xi nghi son", "xi ns" },
            new Dictionary<string, string> { { "Cường độ nén", "PCB40" }, { "Trọng lượng", "50 kg" }, { "Xuất xứ", "Việt Nam" } }
        ));

        productsData.Add((
            "VLXD-X003",
            "Xi măng trắng Hà Tiên",
            "Xi măng trắng dùng để chà ron gạch, trét mạch, trang trí bề mặt nội ngoại thất.",
            "Xi măng & Vữa",
            120000,
            "Bao",
            1,
            null,
            0.05m,
            new[] { "xi trang", "xm trang" },
            new Dictionary<string, string> { { "Loại", "White Portland Cement" }, { "Trọng lượng", "50 kg" }, { "Xuất xứ", "Việt Nam" } }
        ));

        productsData.Add((
            "VLXD-X004",
            "Vữa khô trộn sẵn",
            "Vữa khô trộn sẵn đa năng, chỉ cần pha nước là sử dụng để xây tô gạch mác 75.",
            "Xi măng & Vữa",
            65000,
            "Bao",
            1,
            1.20m, // Coverage at 10mm thickness
            0.05m,
            new[] { "vua kho", "vua tron san" },
            new Dictionary<string, string> { { "Mác vữa", "M75" }, { "Trọng lượng", "25 kg" }, { "Xuất xứ", "Việt Nam" } }
        ));

        // --- Cát & Đá ---
        productsData.Add((
            "VLXD-C001",
            "Cát vàng xây dựng",
            "Cát vàng hạt lớn sạch, chuyên dùng cho đổ bê tông công trình kiên cố.",
            "Cát & Đá",
            350000,
            "Khối(m³)",
            null,
            null,
            0.00m,
            new[] { "cat vang", "cat xay" },
            new Dictionary<string, string> { { "Loại hạt", "Hạt lớn (1.5 - 2.5 mm)" }, { "Công dụng", "Đổ bê tông" }, { "Xuất xứ", "Việt Nam" } }
        ));

        productsData.Add((
            "VLXD-C002",
            "Cát san lấp",
            "Cát đen san lấp nền móng công trình nhà xưởng, đường sá độ nén tốt.",
            "Cát & Đá",
            180000,
            "Khối(m³)",
            null,
            null,
            0.00m,
            new[] { "cat san lap", "cat den" },
            new Dictionary<string, string> { { "Độ tạp chất", "< 5%" }, { "Công dụng", "San lấp nền" } }
        ));

        productsData.Add((
            "VLXD-D001",
            "Đá 1x2 xây dựng",
            "Đá xây dựng kích cỡ 1x2 cm, chuyên dùng cho cốt bê tông móng dầm cột nhà.",
            "Cát & Đá",
            420000,
            "Khối(m³)",
            null,
            null,
            0.00m,
            new[] { "da 1x2", "da dam" },
            new Dictionary<string, string> { { "Kích cỡ hạt", "10 - 20 mm" }, { "Công dụng", "Trộn bê tông" } }
        ));

        productsData.Add((
            "VLXD-D002",
            "Đá 0x4 (đá mi)",
            "Đá cấp phối 0x4 làm nền đường công trình, lót móng gạch nhà xưởng.",
            "Cát & Đá",
            280000,
            "Khối(m³)",
            null,
            null,
            0.00m,
            new[] { "da 0x4", "da mi", "da mat" },
            new Dictionary<string, string> { { "Kích cỡ hạt", "0 - 40 mm" }, { "Loại", "Cấp phối đá dăm" } }
        ));

        // --- Thép xây dựng ---
        productsData.Add((
            "VLXD-T001",
            "Thép Pomina phi 10",
            "Thép cuộn Pomina đường kính 10mm chịu lực uốn kéo móng đai cột dầm.",
            "Thép xây dựng",
            115000,
            "Cây",
            1, // 1 cây = 11.7m
            null,
            0.03m,
            new[] { "thep p10", "thep pomina 10", "sat 10" },
            new Dictionary<string, string> { { "Đường kính", "10 mm" }, { "Chiều dài cây", "11.7 m" }, { "Tiêu chuẩn", "CB300-V" }, { "Xuất xứ", "Việt Nam" } }
        ));

        productsData.Add((
            "VLXD-T002",
            "Thép Pomina phi 12",
            "Thép thanh vằn Pomina phi 12 dầm móng chịu lực kiên cố chất lượng cao.",
            "Thép xây dựng",
            165000,
            "Cây",
            1,
            null,
            0.03m,
            new[] { "thep p12", "thep pomina 12", "sat 12" },
            new Dictionary<string, string> { { "Đường kính", "12 mm" }, { "Chiều dài cây", "11.7 m" }, { "Tiêu chuẩn", "CB400-V" }, { "Xuất xứ", "Việt Nam" } }
        ));

        productsData.Add((
            "VLXD-T003",
            "Thép Pomina phi 16",
            "Thép vằn Pomina phi 16 cốt bê tông nhà cao tầng, cầu cống chịu lực lớn.",
            "Thép xây dựng",
            285000,
            "Cây",
            1,
            null,
            0.03m,
            new[] { "thep p16", "sat 16" },
            new Dictionary<string, string> { { "Đường kính", "16 mm" }, { "Chiều dài cây", "11.7 m" }, { "Tiêu chuẩn", "CB400-V" } }
        ));

        productsData.Add((
            "VLXD-T004",
            "Thép hình V (sắt V) 30x30",
            "Sắt góc V 30x30 dày 3mm dùng làm khung giá kệ, gia công cơ khí kết cấu thép.",
            "Thép xây dựng",
            120000,
            "Cây",
            1, // 1 cây = 6m
            null,
            0.05m,
            new[] { "sat v", "thep v", "thep hinh v" },
            new Dictionary<string, string> { { "Kích thước cánh", "30x30 mm" }, { "Chiều dài cây", "6.0 m" }, { "Độ dày", "3 mm" } }
        ));

        productsData.Add((
            "VLXD-T005",
            "Lưới thép hàn B40",
            "Lưới rào B40 kẽm đan ô vuông bảo vệ công trình chống rỉ sét ngoài trời.",
            "Thép xây dựng",
            750000,
            "Tấm",
            1, // 1 tấm = 50x2m
            null,
            0.05m,
            new[] { "luoi b40", "luoi thep han" },
            new Dictionary<string, string> { { "Kích thước khổ", "2m x 50m" }, { "Đường kính dây", "2.7 mm" }, { "Mạ kẽm", "Có" } }
        ));

        // --- Ống nước & Phụ kiện ---
        productsData.Add((
            "VLXD-O001",
            "Ống nhựa Bình Minh phi 21",
            "Ống nhựa PVC Bình Minh phi 21 dẫn nước sinh hoạt chịu áp lực va đập dẻo dai.",
            "Ống nước & Phụ kiện",
            1500,
            "Cây",
            1, // 1 cây = 4m
            null,
            0.02m,
            new[] { "ong bm 21", "ong binh minh 21" },
            new Dictionary<string, string> { { "Đường kính", "21 mm" }, { "Độ dày", "1.6 mm" }, { "Chiều dài cây", "4.0 m" } }
        ));

        productsData.Add((
            "VLXD-O002",
            "Ống nhựa Bình Minh phi 27",
            "Ống nhựa PVC Bình Minh phi 27 dẫn nước thải, nước sinh hoạt gia đình phổ biến.",
            "Ống nước & Phụ kiện",
            22000,
            "Cây",
            1,
            null,
            0.02m,
            new[] { "ong bm 27", "ong binh minh 27", "ong bm phi 27" },
            new Dictionary<string, string> { { "Đường kính", "27 mm" }, { "Độ dày", "2.0 mm" }, { "Chiều dài cây", "4.0 m" } }
        ));

        productsData.Add((
            "VLXD-O003",
            "Ống nhựa Bình Minh phi 34",
            "Ống nhựa PVC dẫn nước áp lực cao đường kính phi 34 bền bỉ chống ô-xy hóa.",
            "Ống nước & Phụ kiện",
            32000,
            "Cây",
            1,
            null,
            0.02m,
            new[] { "ong bm 34" },
            new Dictionary<string, string> { { "Đường kính", "34 mm" }, { "Độ dày", "2.0 mm" }, { "Chiều dài cây", "4.0 m" } }
        ));

        productsData.Add((
            "VLXD-O004",
            "Ống nhựa Tiền Phong phi 27",
            "Ống nhựa PVC Tiền Phong phi 27 thương hiệu miền Bắc chất lượng truyền thống bền bỉ.",
            "Ống nước & Phụ kiện",
            21000,
            "Cây",
            1,
            null,
            0.02m,
            new[] { "ong tp 27", "ong tien phong 27" },
            new Dictionary<string, string> { { "Đường kính", "27 mm" }, { "Độ dày", "2.0 mm" }, { "Chiều dài cây", "4.0 m" } }
        ));

        productsData.Add((
            "VLXD-O005",
            "Co nhựa PVC 90° phi 27",
            "Co vuông góc nối ống nhựa phi 27 gấp khúc dòng chảy nước thải sinh hoạt.",
            "Ống nước & Phụ kiện",
            4000,
            "Cái",
            null,
            null,
            0.05m,
            new[] { "co 27", "co pvc 27" },
            new Dictionary<string, string> { { "Đường kính nối", "27 mm" }, { "Góc nối", "90 độ" }, { "Vật liệu", "PVC" } }
        ));

        productsData.Add((
            "VLXD-O006",
            "Tê nhựa PVC phi 27",
            "Tê chia 3 nhánh dẫn nước sạch sinh hoạt PVC Bình Minh đường kính phi 27.",
            "Ống nước & Phụ kiện",
            6000,
            "Cái",
            null,
            null,
            0.05m,
            new[] { "te 27", "te pvc 27" },
            new Dictionary<string, string> { { "Đường kính nối", "27 mm" }, { "Kiểu dáng", "Tê chia 3" } }
        ));

        // --- Sơn & Chống thấm ---
        productsData.Add((
            "VLXD-S001",
            "Sơn nội thất Dulux InSpire",
            "Sơn Dulux nội thất mịn màng, phủ màu sắc nét, chống nấm mốc trong nhà tốt.",
            "Sơn & Chống thấm",
            1450000,
            "Thùng",
            1, // 1 thùng = 18L
            216.0m, // 12 m2/L -> 18L * 12 = 216m2
            0.10m,
            new[] { "son dulux", "dulux inspire" },
            new Dictionary<string, string> { { "Thể tích", "18 L" }, { "Bề mặt", "Mịn" }, { "Độ phủ", "12 m2/L" }, { "Xuất xứ", "Việt Nam" } }
        ));

        productsData.Add((
            "VLXD-S002",
            "Sơn ngoại thất Dulux Weathershield",
            "Sơn Dulux chống chịu thời tiết khắc nghiệt, chống phai màu, chống tia UV hiệu quả.",
            "Sơn & Chống thấm",
            2950000,
            "Thùng",
            1, // 1 thùng = 18L
            180.0m, // 10 m2/L -> 18 * 10 = 180m2
            0.10m,
            new[] { "son ngoai troi", "weathershield" },
            new Dictionary<string, string> { { "Thể tích", "18 L" }, { "Bề mặt", "Bóng nhẹ" }, { "Độ phủ", "10 m2/L" } }
        ));

        productsData.Add((
            "VLXD-S003",
            "Sơn lót Dulux",
            "Sơn lót kháng kiềm chống thấm kiềm ẩm rỉ tường tạo độ bám màu bền lâu.",
            "Sơn & Chống thấm",
            1250000,
            "Thùng",
            1, // 1 thùng = 18L
            252.0m, // 14 m2/L -> 18 * 14 = 252m2
            0.05m,
            new[] { "son lot", "dulux lot" },
            new Dictionary<string, string> { { "Thể tích", "18 L" }, { "Độ phủ", "14 m2/L" } }
        ));

        productsData.Add((
            "VLXD-S004",
            "Sơn chống thấm Flinkote",
            "Sơn chống thấm gốc nhựa đường Flinkote quét chống ẩm nhà vệ sinh cổ trần ban công móng.",
            "Sơn & Chống thấm",
            1150000,
            "Thùng",
            1, // 1 thùng = 20L
            16.0m, // 0.8 m2/L (3 lớp) -> 20 * 0.8 = 16m2
            0.10m,
            new[] { "chong tham", "flinkote" },
            new Dictionary<string, string> { { "Thể tích", "20 L" }, { "Độ phủ định mức", "0.8 m2/L" } }
        ));

        productsData.Add((
            "VLXD-S005",
            "Keo chống thấm Sika",
            "Vữa chống thấm đàn hồi 2 thành phần Sika bảo vệ sàn mái nhà vệ sinh sân thượng chống rò rỉ nước.",
            "Sơn & Chống thấm",
            950000,
            "Thùng",
            1, // 1 thùng = 25kg
            16.6m, // 1.5 m2/kg at 1mm thickness -> 25 / 1.5 = 16.6m2
            0.05m,
            new[] { "sika", "keo sika", "chong tham sika" },
            new Dictionary<string, string> { { "Trọng lượng", "25 kg" }, { "Thành phần", "2 thành phần" } }
        ));

        // 3. Insert and wire sub-entities for each product
        foreach (var p in productsData)
        {
            var product = await db.Products
                .Include(prod => prod.Specs)
                .Include(prod => prod.Aliases)
                .Include(prod => prod.PriceTiers)
                .FirstOrDefaultAsync(prod => prod.Sku == p.Sku);

            if (product == null)
            {
                var category = categories[p.CategoryName];
                
                product = new Product(
                    p.Sku,
                    p.Name,
                    p.Description,
                    category.Id,
                    p.BasePrice,
                    p.UnitOfMeasure,
                    p.UnitsPerPackage,
                    p.CoveragePerPackage,
                    p.WastageRate
                );

                // Add tiers (Retail=100%, Contractor=92%, Dealer=85%)
                product.PriceTiers.Add(new PriceTier(product.Id, "Retail", p.BasePrice, 1));
                product.PriceTiers.Add(new PriceTier(product.Id, "Contractor", Math.Round(p.BasePrice * 0.92m, 2), 1));
                product.PriceTiers.Add(new PriceTier(product.Id, "Dealer", Math.Round(p.BasePrice * 0.85m, 2), 1));

                // Add specs
                foreach (var spec in p.Specs)
                {
                    product.Specs.Add(new ProductSpec(product.Id, spec.Key, spec.Value));
                }

                // Add aliases
                foreach (var alias in p.Aliases)
                {
                    product.Aliases.Add(new ProductAlias(product.Id, alias));
                }

                db.Products.Add(product);
            }
        }

        await db.SaveChangesAsync();
    }

    /// <summary>
    /// Seeds initial warehouses, vehicles, and inventory stock in WMS database.
    /// </summary>
    private static async Task SeedWmsAsync(WmsDbContext wmsDb, CatalogDbContext catalogDb)
    {
        // 1. Seed Warehouses
        var warehouses = new List<Warehouse>();
        if (!await wmsDb.Warehouses.AnyAsync())
        {
            warehouses.Add(new Warehouse("Kho Thủ Đức", "Linh Trung, Thủ Đức, TP. HCM"));
            warehouses.Add(new Warehouse("Kho Bình Dương", "Dĩ An, Bình Dương"));
            wmsDb.Warehouses.AddRange(warehouses);
            await wmsDb.SaveChangesAsync();
        }
        else
        {
            warehouses = await wmsDb.Warehouses.ToListAsync();
        }

        // 2. Seed Vehicles
        if (!await wmsDb.Vehicles.AnyAsync())
        {
            var vehicles = new List<Vehicle>
            {
                new Vehicle("51C-123.45", "Nguyễn Văn A", "0901234567"),
                new Vehicle("51C-678.90", "Trần Văn B", "0907654321"),
                new Vehicle("60C-555.55", "Lê Văn C", "0911223344")
            };
            wmsDb.Vehicles.AddRange(vehicles);
            await wmsDb.SaveChangesAsync();
        }

        // 3. Seed Inventory for all catalog products
        var products = await catalogDb.Products.ToListAsync();
        var rand = new Random();

        foreach (var product in products)
        {
            foreach (var warehouse in warehouses)
            {
                var hasInventory = await wmsDb.Inventory
                    .AnyAsync(i => i.WarehouseId == warehouse.Id && i.ProductId == product.Id);

                if (!hasInventory)
                {
                    // Generate random stock quantity between 50 and 500
                    decimal quantity = rand.Next(50, 501);
                    // Determine an arbitrary bin location
                    string bin = $"BIN-{rand.Next(1, 10):D2}";

                    var inventoryItem = new InventoryItem(warehouse.Id, product.Id, quantity, bin);
                    wmsDb.Inventory.Add(inventoryItem);
                }
            }
        }

        await wmsDb.SaveChangesAsync();
    }

    /// <summary>
    /// Seeds default AI chat sessions, messages, and Support Ticket escalations.
    /// </summary>
    private static async Task SeedAiAsync(VLXD.Modules.AI.Infrastructure.AiDbContext db)
    {
        if (await db.ChatSessions.AnyAsync())
        {
            return;
        }

        // Seed 1: A consultation session
        var session1 = new VLXD.Modules.AI.Domain.Entities.ChatSession(null, "Web");
        db.ChatSessions.Add(session1);
        await db.SaveChangesAsync();

        var m1_1 = new VLXD.Modules.AI.Domain.Entities.ChatMessage(session1.Id, "user", "Tôi muốn tư vấn gạch lát vỉa hè cho diện tích 50m2", VLXD.Modules.AI.Domain.Enums.SentimentLevel.Neutral);
        var m1_2 = new VLXD.Modules.AI.Domain.Entities.ChatMessage(session1.Id, "assistant", "Dạ chào anh, với diện tích 50m2 anh nên sử dụng Gạch Terrazzo 400x400 (SKU: VLXD-G001). Số lượng cần mua tạm tính đã cộng 5% hao hụt là 55 thùng.");
        
        session1.AddMessage(m1_1);
        session1.AddMessage(m1_2);
        
        db.ChatMessages.AddRange(m1_1, m1_2);

        // Seed 2: An angry customer session requiring escalation
        var session2 = new VLXD.Modules.AI.Domain.Entities.ChatSession(null, "Web");
        db.ChatSessions.Add(session2);
        await db.SaveChangesAsync();

        var m2_1 = new VLXD.Modules.AI.Domain.Entities.ChatMessage(session2.Id, "user", "Đơn hàng trễ quá rồi, tôi rất bực mình!", VLXD.Modules.AI.Domain.Enums.SentimentLevel.Negative);
        var m2_2 = new VLXD.Modules.AI.Domain.Entities.ChatMessage(session2.Id, "assistant", "Chúng tôi vô cùng xin lỗi vì sự bất tiện này. Hệ thống đã tự động tạo một Ticket hỗ trợ khẩn cấp gửi tới đội ngũ vận hành.");
        
        session2.AddMessage(m2_1);
        session2.AddMessage(m2_2);

        db.ChatMessages.AddRange(m2_1, m2_2);

        // Seed 3: Support Ticket linked to session2
        var ticket = new VLXD.Modules.AI.Domain.Entities.SupportTicket(session2.Id, null, VLXD.Modules.AI.Domain.Enums.TicketPriority.Urgent, "Khách hàng khiếu nại (Sentiment: Negative): Đơn hàng trễ quá rồi, tôi rất bực mình!");
        db.SupportTickets.Add(ticket);

        await db.SaveChangesAsync();
    }

    #endregion
}
