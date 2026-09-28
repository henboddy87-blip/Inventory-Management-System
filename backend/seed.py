"""
Comprehensive Seed Script for Cambodian SME Inventory System
Business Name: Khmer Style Fashion
"""
from datetime import datetime, timedelta, timezone
from app.core.database import SessionLocal, engine, Base
from app.core.security import hash_password
import app.models # Ensure all models are registered
from app.models.user import Role, Permission, User
from app.models.category_brand import Category, Brand, Unit
from app.models.warehouse import Warehouse
from app.models.product import Product, ProductVariant
from app.models.partner import Supplier, Customer
from app.models.stock import WarehouseStock, StockMovement
from app.models.purchase import Purchase, PurchaseItem
from app.models.sale import Sale, SaleItem
from app.models.finance import ExpenseCategory, Expense, Payment
from app.models.system import Setting, Notification, AuditLog

def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Check if already seeded
        if db.query(User).filter(User.username == "admin").first():
            print("Database already seeded. Skipping initial seeding.")
            return

        print("Seeding database with realistic Cambodian SME data...")

        # 1. Roles & Permissions
        roles_data = [
            ("super_admin", "Super Admin", "Unrestricted system access"),
            ("admin", "Admin / Owner", "Business owner with full operational access"),
            ("manager", "Store Manager", "Can manage stock, purchases, and sales"),
            ("staff", "Sales Staff", "Can process sales, view products and stock"),
            ("accountant", "Accountant", "Can manage expenses, view financial reports")
        ]
        roles_map = {}
        for name, dname, desc in roles_data:
            role = Role(name=name, display_name=dname, description=desc)
            db.add(role)
            db.flush()
            roles_map[name] = role

        # 2. Users
        users_data = [
            ("admin@khmerstyle.com", "admin", "Sophea Chea", "+855 12 345 678", roles_map["super_admin"].id, "Admin123!"),
            ("manager@khmerstyle.com", "manager", "Dara Sam", "+855 16 789 012", roles_map["manager"].id, "Manager123!"),
            ("staff@khmerstyle.com", "staff", "Bopha Pich", "+855 98 456 123", roles_map["staff"].id, "Staff123!"),
            ("accountant@khmerstyle.com", "accountant", "Rathana Long", "+855 77 654 321", roles_map["accountant"].id, "Account123!")
        ]
        users_map = {}
        for email, uname, fname, phone, rid, pwd in users_data:
            user = User(
                email=email,
                username=uname,
                full_name=fname,
                phone=phone,
                role_id=rid,
                hashed_password=hash_password(pwd),
                is_active=True
            )
            db.add(user)
            db.flush()
            users_map[uname] = user

        admin_user = users_map["admin"]

        # 3. Units
        units_data = [
            ("Piece", "pcs", "កំប៉ុង/ដុំ", True),
            ("Pair", "pr", "គូ", False),
            ("Box", "box", "ប្រអប់", False),
            ("Set", "set", "ឈុត", False),
            ("Kilogram", "kg", "គីឡូក្រាម", False),
        ]
        units_map = {}
        for name, sym, kh, is_def in units_data:
            u = Unit(name=name, symbol=sym, khmer_name=kh, is_default=is_def)
            db.add(u)
            db.flush()
            units_map[name] = u

        # 4. Warehouses
        warehouses_data = [
            ("Central Warehouse (Phnom Penh)", "ឃ្លាំងកណ្តាល ភ្នំពេញ", "Street 271, Sangkat Boeng Tumpun, Khan Meanchey", "Phnom Penh", "+855 23 888 111", "Dara Sam", True),
            ("Siem Reap Branch Store", "សាខា ខេត្តសៀមរាប", "Sivutha Blvd, Svay Dangkum", "Siem Reap", "+855 63 965 222", "Kosal Vong", False),
            ("Battambang Depot", "ឃ្លាំងស្តុក ខេត្តបាត់ដំបង", "National Road 5, Sangkat Svay Pao", "Battambang", "+855 53 730 333", "Vireak Hem", False),
        ]
        warehouses_map = {}
        for name, kh, loc, prov, ph, mgr, is_def in warehouses_data:
            w = Warehouse(
                name=name,
                khmer_name=kh,
                location=loc,
                province=prov,
                phone=ph,
                manager_name=mgr,
                is_default=is_def,
                status=True
            )
            db.add(w)
            db.flush()
            warehouses_map[name] = w

        central_wh = warehouses_map["Central Warehouse (Phnom Penh)"]
        siem_reap_wh = warehouses_map["Siem Reap Branch Store"]

        # 5. Categories (Parent & Child)
        cats_data = [
            ("Men's Fashion", "សម្លៀកបំពាក់បុរស", "Apparel designed for men", None),
            ("Women's Fashion", "សម្លៀកបំពាក់នារី", "Apparel designed for women", None),
            ("Footwear", "ស្បែកជើង", "Shoes, sneakers and sandals", None),
            ("Electronics & Gadgets", "គ្រឿងអេឡិចត្រូនិច", "Smart gadgets, chargers and audio", None),
            ("Bags & Luggage", "កាបូប និងវ៉ាលី", "Backpacks, handbags and wallets", None),
        ]
        cats_map = {}
        for name, kh, desc, pid in cats_data:
            c = Category(name=name, khmer_name=kh, description=desc, parent_id=pid)
            db.add(c)
            db.flush()
            cats_map[name] = c

        # 6. Brands
        brands_data = [
            ("Khmer Silk Co.", "សូត្រខ្មែរ", "Traditional and modern Cambodian silk wear"),
            ("Angkor Urban", "អង្គរ អឺបាន", "Contemporary Cambodian street style"),
            ("Zando Select", "ហ្សាន់ដូ សិឡិច", "Trending everyday casual wear"),
            ("SoundPro Cambodia", "សោនប្រូ", "Premium portable electronics"),
            ("Phnom Penh Leather", "ស្បែកភ្នំពេញ", "Handcrafted leather accessories")
        ]
        brands_map = {}
        for name, kh, desc in brands_data:
            b = Brand(name=name, khmer_name=kh, description=desc)
            db.add(b)
            db.flush()
            brands_map[name] = b

        # 7. Suppliers
        suppliers_data = [
            ("Phnom Penh Garment Supplies", "ភ្នំពេញ ហ្គាមេន សឹបផ្លាយ", "Mr. Heng Srun", "+855 12 889 001", "sales@ppgarment.com.kh", "Veng Sreng Blvd, Phnom Penh", "Phnom Penh", "K001-90182", "Net 30"),
            ("Mekong Textile Wholesale", "មេគង្គ តិចស្ទាល ហូលសេល", "Mrs. Chantrea Keo", "+855 17 445 667", "order@mekongtextile.kh", "National Road 2, Kandal", "Kandal", "K002-88712", "Net 15"),
            ("Angkor Footwear Factory", "រោងចក្រស្បែកជើងអង្គរ", "Mr. Bunthoeun Sim", "+855 63 881 234", "factory@angkorfootwear.com", "Chreav Village, Siem Reap", "Siem Reap", "K003-77219", "Net 30"),
            ("SmartTech Phnom Penh Import", "ស្មាតថេក ភ្នំពេញ អ៊ីមផត", "Mr. Rithy Sok", "+855 23 999 555", "info@smarttech-kh.com", "Russian Blvd, Tuol Kork, Phnom Penh", "Phnom Penh", "K004-55410", "Cash on Delivery")
        ]
        suppliers_map = {}
        for cname, khname, cperson, ph, em, addr, prov, tax, terms in suppliers_data:
            s = Supplier(
                company_name=cname,
                khmer_company_name=khname,
                contact_person=cperson,
                phone=ph,
                email=em,
                address=addr,
                province=prov,
                tax_id=tax,
                payment_terms=terms
            )
            db.add(s)
            db.flush()
            suppliers_map[cname] = s

        # 8. Customers
        customers_data = [
            ("Sokha Chan", "ចាន់ សុខា", "+855 12 778 899", "sokha.chan@gmail.com", "Boeng Keng Kang 1, Phnom Penh", "Phnom Penh", "Retail", 0.0),
            ("Vannak Meas", "មាស វណ្ណៈ", "+855 92 334 455", "vannak.meas@yahoo.com", "Wat Bo Village, Siem Reap", "Siem Reap", "Wholesale", 1500.0),
            ("Bopha Chea", "ជា បុប្ផា", "+855 70 889 900", "bopha.chea@hotmail.com", "Sangkat 2, Preah Sihanouk", "Preah Sihanouk", "VIP", 500.0),
            ("Rithy Seng", "សេង រិទ្ធី", "+855 88 556 677", "rithy.seng@gmail.com", "Sangkat Svay Pao, Battambang", "Battambang", "Business", 2000.0)
        ]
        customers_map = {}
        for name, kh, ph, em, addr, prov, ctype, clim in customers_data:
            c = Customer(
                name=name,
                khmer_name=kh,
                phone=ph,
                email=em,
                address=addr,
                province=prov,
                customer_type=ctype,
                credit_limit=clim
            )
            db.add(c)
            db.flush()
            customers_map[name] = c

        # 9. Products & Initial Stock
        products_data = [
            {
                "sku": "TSH-KHM-001",
                "barcode": "885901234501",
                "name": "Angkor Graphic Cotton T-Shirt",
                "khmer_name": "អាវយឺតកប្បាស រូបប្រាសាទអង្គរ",
                "desc": "100% premium combed cotton t-shirt with screen-printed Angkor silhouette.",
                "cat": cats_map["Men's Fashion"].id,
                "brand": brands_map["Angkor Urban"].id,
                "unit": units_map["Piece"].id,
                "cost": 5.50,
                "sell": 12.00,
                "wholesale": 8.50,
                "min": 15,
                "max": 200,
                "variants": [
                    ("TSH-KHM-001-BLK-M", "8859012345011", "M", "Black", 5.50, 12.00),
                    ("TSH-KHM-001-BLK-L", "8859012345012", "L", "Black", 5.50, 12.00),
                    ("TSH-KHM-001-WHT-M", "8859012345013", "M", "White", 5.50, 12.00)
                ],
                "initial_stock": 85
            },
            {
                "sku": "POLO-ZND-002",
                "barcode": "885901234502",
                "name": "Classic Pique Polo Shirt",
                "khmer_name": "អាវប៉ូឡូ ករបត់បែបបុរាណ",
                "desc": "Breathable pique knit polo shirt perfect for Phnom Penh warm climate.",
                "cat": cats_map["Men's Fashion"].id,
                "brand": brands_map["Zando Select"].id,
                "unit": units_map["Piece"].id,
                "cost": 8.00,
                "sell": 18.50,
                "wholesale": 13.00,
                "min": 10,
                "max": 150,
                "variants": [
                    ("POLO-002-NAVY-M", "8859012345021", "M", "Navy Blue", 8.00, 18.50),
                    ("POLO-002-NAVY-L", "8859012345022", "L", "Navy Blue", 8.00, 18.50)
                ],
                "initial_stock": 60
            },
            {
                "sku": "DRS-SLK-003",
                "barcode": "885901234503",
                "name": "Khmer Silk Modern Floral Dress",
                "khmer_name": "រ៉ូបសូត្រខ្មែរ ម៉ូដផ្កាទំនើប",
                "desc": "Handwoven Cambodian silk dress with elegant tailor-fitted design.",
                "cat": cats_map["Women's Fashion"].id,
                "brand": brands_map["Khmer Silk Co."].id,
                "unit": units_map["Piece"].id,
                "cost": 22.00,
                "sell": 48.00,
                "wholesale": 35.00,
                "min": 5,
                "max": 60,
                "variants": [],
                "initial_stock": 25
            },
            {
                "sku": "SNK-URB-004",
                "barcode": "885901234504",
                "name": "Urban Comfort Canvas Sneakers",
                "khmer_name": "ស្បែកជើងប៉ាតាក្រណាត់ បែបទាន់សម័យ",
                "desc": "Lightweight vulcanized sole canvas sneakers for everyday comfort.",
                "cat": cats_map["Footwear"].id,
                "brand": brands_map["Angkor Urban"].id,
                "unit": units_map["Pair"].id,
                "cost": 11.00,
                "sell": 25.00,
                "wholesale": 17.00,
                "min": 12,
                "max": 120,
                "variants": [
                    ("SNK-004-BLK-41", "8859012345041", "41", "Black", 11.00, 25.00),
                    ("SNK-004-BLK-42", "8859012345042", "42", "Black", 11.00, 25.00)
                ],
                "initial_stock": 40
            },
            {
                "sku": "BAG-LTH-005",
                "barcode": "885901234505",
                "name": "Handmade Genuine Leather Crossbody Bag",
                "khmer_name": "កាបូបស្ពាយចំហៀង ស្បែកសុទ្ធធ្វើដោយដៃ",
                "desc": "Artisan top-grain leather shoulder bag crafted in Phnom Penh.",
                "cat": cats_map["Bags & Luggage"].id,
                "brand": brands_map["Phnom Penh Leather"].id,
                "unit": units_map["Piece"].id,
                "cost": 16.00,
                "sell": 36.00,
                "wholesale": 26.00,
                "min": 6,
                "max": 80,
                "variants": [],
                "initial_stock": 30
            },
            {
                "sku": "EAR-AUD-006",
                "barcode": "885901234506",
                "name": "Wireless Noise-Canceling Earbuds Pro",
                "khmer_name": "កាសស្តាប់ឥតខ្សែ បច្ចេកវិទ្យាកាត់បន្ថយសម្លេងរំខាន",
                "desc": "Bluetooth 5.3 earbuds with 32h battery life and deep bass tuning.",
                "cat": cats_map["Electronics & Gadgets"].id,
                "brand": brands_map["SoundPro Cambodia"].id,
                "unit": units_map["Piece"].id,
                "cost": 14.50,
                "sell": 32.00,
                "wholesale": 22.00,
                "min": 8,
                "max": 100,
                "variants": [],
                "initial_stock": 45
            },
            {
                "sku": "JNS-SLM-007",
                "barcode": "885901234507",
                "name": "Slim Fit Stretch Denim Jeans",
                "khmer_name": "ខោខូវប៊យ ជើងរាងយឺតស្រួលពាក់",
                "desc": "Comfort stretch indigo wash denim jeans.",
                "cat": cats_map["Men's Fashion"].id,
                "brand": brands_map["Zando Select"].id,
                "unit": units_map["Piece"].id,
                "cost": 10.00,
                "sell": 24.00,
                "wholesale": 16.50,
                "min": 10,
                "max": 100,
                "variants": [],
                "initial_stock": 4
            }  # Low stock on purpose!
        ]

        products_map = {}
        for pdata in products_data:
            p = Product(
                sku=pdata["sku"],
                barcode=pdata["barcode"],
                name=pdata["name"],
                khmer_name=pdata["khmer_name"],
                description=pdata["desc"],
                category_id=pdata["cat"],
                brand_id=pdata["brand"],
                unit_id=pdata["unit"],
                cost_price=pdata["cost"],
                selling_price=pdata["sell"],
                wholesale_price=pdata["wholesale"],
                min_stock=pdata["min"],
                max_stock=pdata["max"],
                has_variants=bool(pdata["variants"]),
                status=True
            )
            db.add(p)
            db.flush()
            products_map[p.sku] = p

            # Variants
            for v_sku, v_bar, v_sz, v_col, v_c, v_s in pdata["variants"]:
                var = ProductVariant(
                    product_id=p.id,
                    sku=v_sku,
                    barcode=v_bar,
                    size=v_sz,
                    color=v_col,
                    cost_price=v_c,
                    selling_price=v_s
                )
                db.add(var)

            # Opening stock in Central Warehouse
            wh_stock = WarehouseStock(
                warehouse_id=central_wh.id,
                product_id=p.id,
                variant_id=None,
                current_stock=pdata["initial_stock"]
            )
            db.add(wh_stock)

            # Stock movement
            mov = StockMovement(
                product_id=p.id,
                variant_id=None,
                warehouse_id=central_wh.id,
                movement_type="Opening Stock",
                quantity=pdata["initial_stock"],
                before_quantity=0,
                after_quantity=pdata["initial_stock"],
                reference_number=f"OPN-{p.sku}",
                user_id=admin_user.id,
                note="Initial inventory record"
            )
            db.add(mov)

        # 10. Sample Completed Purchase Orders
        po_date = datetime.now(timezone.utc) - timedelta(days=14)
        po1 = Purchase(
            po_number="PO-2026-001",
            supplier_id=suppliers_map["Phnom Penh Garment Supplies"].id,
            warehouse_id=central_wh.id,
            purchase_date=po_date,
            subtotal=1100.0,
            discount=50.0,
            tax=0.0,
            shipping_cost=20.0,
            total_amount=1070.0,
            paid_amount=1070.0,
            payment_status="Paid",
            purchase_status="Received",
            notes="Weekly replenishment order",
            created_by_id=admin_user.id
        )
        db.add(po1)
        db.flush()

        # 11. Sample Sales Invoices (Cash, KHQR, Bank Transfer)
        # Sale 1: KHQR payment to Sokha Chan
        sale1_date = datetime.now(timezone.utc) - timedelta(days=3)
        sale1 = Sale(
            invoice_number="INV-2026-001",
            customer_id=customers_map["Sokha Chan"].id,
            warehouse_id=central_wh.id,
            sale_date=sale1_date,
            subtotal=60.00,
            discount_amount=5.00,
            tax_amount=0.0,
            total_amount=55.00,
            paid_amount=55.00,
            payment_method="KHQR",
            payment_status="Paid",
            status="Completed",
            khqr_reference="KHQR-BAKONG-8829104",
            notes="Bakong KHQR payment verified",
            salesperson_id=users_map["staff"].id
        )
        db.add(sale1)
        db.flush()

        s1_prod = products_map["TSH-KHM-001"]
        s1_item = SaleItem(
            sale_id=sale1.id,
            product_id=s1_prod.id,
            variant_id=None,
            quantity=5,
            unit_price=12.00,
            cost_price=5.50,
            discount=5.00,
            subtotal=55.00,
            profit=(55.00 - (5 * 5.50))
        )
        db.add(s1_item)

        # Record payment
        db.add(Payment(
            transaction_type="Sale",
            reference_id=sale1.id,
            reference_number=sale1.invoice_number,
            payment_date=sale1_date,
            amount=55.00,
            payment_method="KHQR",
            notes="KHQR Bakong transaction",
            recorded_by_id=users_map["staff"].id
        ))

        # Sale 2: Wholesale Sale to Vannak Meas
        sale2_date = datetime.now(timezone.utc) - timedelta(days=1)
        sale2 = Sale(
            invoice_number="INV-2026-002",
            customer_id=customers_map["Vannak Meas"].id,
            warehouse_id=central_wh.id,
            sale_date=sale2_date,
            subtotal=320.00,
            discount_amount=20.00,
            tax_amount=0.0,
            total_amount=300.00,
            paid_amount=200.00,
            payment_method="Bank Transfer",
            payment_status="Partially Paid",
            status="Completed",
            khqr_reference="ABA-TXN-9912048",
            notes="ABA Bank transfer $200. Remaining $100 due in 15 days.",
            salesperson_id=admin_user.id
        )
        db.add(sale2)
        db.flush()

        s2_prod = products_map["EAR-AUD-006"]
        s2_item = SaleItem(
            sale_id=sale2.id,
            product_id=s2_prod.id,
            variant_id=None,
            quantity=10,
            unit_price=32.00,
            cost_price=14.50,
            discount=20.00,
            subtotal=300.00,
            profit=(300.00 - (10 * 14.50))
        )
        db.add(s2_item)

        # Payment for sale 2
        db.add(Payment(
            transaction_type="Sale",
            reference_id=sale2.id,
            reference_number=sale2.invoice_number,
            payment_date=sale2_date,
            amount=200.00,
            payment_method="Bank Transfer",
            notes="Partial ABA Bank transfer",
            recorded_by_id=admin_user.id
        ))

        # 12. Expense Categories & Sample Expenses
        exp_cats = [
            ("Rent", "ថ្លៃជួលទីតាំង", "Shop and warehouse lease expenses"),
            ("Electricity & Water", "ថ្លៃភ្លើង និងទឹក", "EDC utility bills"),
            ("Internet & Telecom", "សេវាអ៊ីនធឺណិត", "WiFi and phone lines"),
            ("Staff Salary", "ប្រាក់បៀវត្សរ៍បុគ្គលិក", "Monthly payroll"),
            ("Marketing & Advertising", "ការផ្សព្វផ្សាយពាណិជ្ជកម្ម", "Facebook and TikTok boost campaigns"),
            ("Packaging", "សម្ភារវេចខ្ចប់", "Branded bags and boxes"),
            ("Transportation", "សេវាដឹកជញ្ជូន", "Local delivery fees (Vireak Buntham, J&T)")
        ]
        for name, kh, desc in exp_cats:
            ec = ExpenseCategory(name=name, khmer_name=kh, description=desc)
            db.add(ec)
            db.flush()

        rent_cat = db.query(ExpenseCategory).filter(ExpenseCategory.name == "Rent").first()
        elec_cat = db.query(ExpenseCategory).filter(ExpenseCategory.name == "Electricity & Water").first()
        mktg_cat = db.query(ExpenseCategory).filter(ExpenseCategory.name == "Marketing & Advertising").first()

        db.add(Expense(
            category_id=rent_cat.id,
            amount=450.00,
            description="Central store monthly lease payment for October",
            payment_method="Bank Transfer",
            expense_date=datetime.now(timezone.utc) - timedelta(days=5),
            user_id=users_map["accountant"].id
        ))

        db.add(Expense(
            category_id=elec_cat.id,
            amount=115.00,
            description="EDC Electricity bill for store air-conditioning",
            payment_method="Cash",
            expense_date=datetime.now(timezone.utc) - timedelta(days=2),
            user_id=users_map["accountant"].id
        ))

        db.add(Expense(
            category_id=mktg_cat.id,
            amount=75.00,
            description="Khmer New Year promotional campaign on Facebook",
            payment_method="Card",
            expense_date=datetime.now(timezone.utc) - timedelta(days=4),
            user_id=admin_user.id
        ))

        # 13. System Settings
        settings_data = [
            ("company_name", "Khmer Style Fashion (ខេមរា ស្ទីល ហ្វេសសិន)", "Registered business trading name"),
            ("default_currency", "USD", "System primary transaction currency"),
            ("exchange_rate_khr", "4100", "Cambodian Riel conversion rate per 1 USD"),
            ("khqr_merchant_name", "KHMER STYLE FASHION CO LTD", "Bakong KHQR registered merchant name"),
            ("khqr_account_id", "khmerstyle@aba", "Bakong merchant account identifier"),
            ("business_phone", "+855 23 888 999", "Customer support contact hotline"),
            ("business_address", "Building 45, Street 271, Phnom Penh, Cambodia", "Business physical headquarters"),
            ("tax_rate_percent", "10", "Standard Value Added Tax (VAT) rate")
        ]
        for key, val, desc in settings_data:
            s = Setting(key=key, value=val, description=desc)
            db.add(s)

        # 14. Notifications
        db.add(Notification(
            title="Low Stock Alert: Slim Fit Stretch Denim Jeans",
            khmer_title="ការជូនដំណឹងអំពីស្តុកជិតអស់៖ ខោខូវប៊យ ជើងរាងយឺតស្រួលពាក់",
            message="Item JNS-SLM-007 has only 4 units remaining (Min threshold: 10). Please reorder soon.",
            khmer_message="ទំនិញ JNS-SLM-007 មានសល់ត្រឹមតែ ៤ ដុំទៀតប៉ុណ្ណោះក្នុងស្តុក។ សូមធ្វើការបញ្ជាទិញបន្ថែម។",
            notification_type="low_stock",
            link="/inventory",
            is_read=False
        ))

        db.add(Notification(
            title="Pending Payment: Vannak Meas",
            khmer_title="ការទូទាត់ប្រាក់នៅសល់៖ មាស វណ្ណៈ",
            message="Invoice INV-2026-002 has an unpaid balance of $100.00.",
            khmer_message="វិក្កយបត្រ INV-2026-002 នៅជំពាក់ប្រាក់ចំនួន $១០០.០០ ដុល្លារ។",
            notification_type="payment_due",
            link="/sales",
            is_read=False
        ))

        # 15. Initial Audit Log
        db.add(AuditLog(
            user_id=admin_user.id,
            action="SYSTEM_INIT",
            entity="System",
            entity_id="0",
            description="System successfully initialized with Cambodian SME business seed dataset.",
            timestamp=datetime.now(timezone.utc)
        ))

        db.commit()
        print("Database seeded successfully with all Cambodian SME demo data!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
