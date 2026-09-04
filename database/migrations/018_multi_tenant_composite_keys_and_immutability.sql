-- database/migrations/018_multi_tenant_composite_keys_and_immutability.sql
-- Production Multi-Tenant Architecture, Composite Foreign Keys, Immutability Triggers & Permission Engine

-- 1. EXTENSIONS & ENUMS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$ BEGIN
    CREATE TYPE member_type AS ENUM ('owner', 'worker');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_method AS ENUM ('cash', 'upi', 'card', 'bank_transfer', 'cheque');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE movement_type AS ENUM ('sale', 'purchase', 'adjustment_add', 'adjustment_sub', 'reversal');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE ledger_entry_type AS ENUM ('credit_sale', 'payment_received', 'adjustment_debit', 'adjustment_credit', 'reversal');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. CORE SYSTEM TABLES
CREATE TABLE IF NOT EXISTS shops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    business_type VARCHAR(100) NOT NULL,
    upi_id VARCHAR(100),
    phone VARCHAR(20) NOT NULL,
    address TEXT,
    currency VARCHAR(10) DEFAULT 'INR',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    phone VARCHAR(20) UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shop_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    member_type member_type NOT NULL,
    worker_name VARCHAR(255),
    worker_phone VARCHAR(20),
    pin_hash VARCHAR(255),
    activation_code_hash VARCHAR(255),
    activation_expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT FALSE,
    permissions JSONB DEFAULT '[]'::jsonb, -- Array of string action codes
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_shop_user UNIQUE (shop_id, user_id),
    CONSTRAINT uq_shop_worker_phone UNIQUE (shop_id, worker_phone),
    CONSTRAINT uq_shop_membership_composite UNIQUE (id, shop_id)
);

-- 3. BUSINESS ENTITIES WITH COMPOSITE KEYS FOR TENANT INTEGRITY
CREATE TABLE IF NOT EXISTS customers (
    id UUID DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    credit_limit NUMERIC(12, 2) DEFAULT 0.00,
    current_balance NUMERIC(12, 2) DEFAULT 0.00, -- Derived optimization
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (id, shop_id)
);

CREATE TABLE IF NOT EXISTS products (
    id UUID DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    barcode VARCHAR(100),
    category VARCHAR(100),
    unit VARCHAR(50) DEFAULT 'pcs',
    selling_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    cost_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    current_stock NUMERIC(12, 3) NOT NULL DEFAULT 0.000, -- Derived optimization
    low_stock_threshold NUMERIC(12, 3) DEFAULT 5.000,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (id, shop_id),
    CONSTRAINT uq_product_barcode_shop UNIQUE (shop_id, barcode)
);

-- 4. SALES, ATTACHMENTS & ITEMS
CREATE TABLE IF NOT EXISTS sales (
    id UUID DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    customer_id UUID,
    created_by_member_id UUID NOT NULL,
    invoice_number VARCHAR(100) NOT NULL,
    subtotal NUMERIC(12, 2) NOT NULL,
    discount_amount NUMERIC(12, 2) DEFAULT 0.00,
    total_amount NUMERIC(12, 2) NOT NULL,
    paid_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    balance_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    payment_method payment_method,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (id, shop_id),
    CONSTRAINT fk_sale_customer FOREIGN KEY (customer_id, shop_id) 
        REFERENCES customers(id, shop_id) ON DELETE RESTRICT,
    CONSTRAINT fk_sale_member FOREIGN KEY (created_by_member_id, shop_id) 
        REFERENCES shop_memberships(id, shop_id) ON DELETE RESTRICT,
    CONSTRAINT uq_sale_invoice_shop UNIQUE (shop_id, invoice_number)
);

CREATE TABLE IF NOT EXISTS sale_items (
    id UUID DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL,
    shop_id UUID NOT NULL,
    product_id UUID NOT NULL,
    quantity NUMERIC(12, 3) NOT NULL,
    unit_price NUMERIC(12, 2) NOT NULL,
    cost_price NUMERIC(12, 2) NOT NULL,
    total_price NUMERIC(12, 2) NOT NULL,
    PRIMARY KEY (id, shop_id),
    CONSTRAINT fk_item_sale FOREIGN KEY (sale_id, shop_id) 
        REFERENCES sales(id, shop_id) ON DELETE CASCADE,
    CONSTRAINT fk_item_product FOREIGN KEY (product_id, shop_id) 
        REFERENCES products(id, shop_id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS sale_attachments (
    id UUID DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    sale_id UUID NOT NULL,
    storage_path TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (id, shop_id),
    CONSTRAINT fk_attachment_sale FOREIGN KEY (sale_id, shop_id) 
        REFERENCES sales(id, shop_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS payments (
    id UUID DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL,
    received_by_member_id UUID NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    payment_method payment_method NOT NULL,
    reference_id VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (id, shop_id),
    CONSTRAINT fk_payment_customer FOREIGN KEY (customer_id, shop_id) 
        REFERENCES customers(id, shop_id) ON DELETE RESTRICT,
    CONSTRAINT fk_payment_member FOREIGN KEY (received_by_member_id, shop_id) 
        REFERENCES shop_memberships(id, shop_id) ON DELETE RESTRICT
);

-- 5. IMMUTABLE FINANCIAL LEDGER & INVENTORY AUDIT TRAILS
CREATE TABLE IF NOT EXISTS ledger_entries (
    id UUID DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL,
    entry_type ledger_entry_type NOT NULL,
    debit NUMERIC(12, 2) DEFAULT 0.00,  -- Increases customer debt
    credit NUMERIC(12, 2) DEFAULT 0.00, -- Decreases customer debt
    running_balance NUMERIC(12, 2) NOT NULL,
    reference_sale_id UUID,
    reference_payment_id UUID,
    reversal_of_id UUID,
    notes TEXT,
    created_by_member_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (id, shop_id),
    CONSTRAINT fk_ledger_customer FOREIGN KEY (customer_id, shop_id) 
        REFERENCES customers(id, shop_id) ON DELETE RESTRICT,
    CONSTRAINT fk_ledger_member FOREIGN KEY (created_by_member_id, shop_id) 
        REFERENCES shop_memberships(id, shop_id) ON DELETE RESTRICT,
    CONSTRAINT fk_ledger_reversal FOREIGN KEY (reversal_of_id, shop_id) 
        REFERENCES ledger_entries(id, shop_id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS inventory_movements (
    id UUID DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    product_id UUID NOT NULL,
    movement_type movement_type NOT NULL,
    quantity_delta NUMERIC(12, 3) NOT NULL, -- Positive for intake, negative for deduction
    resulting_stock NUMERIC(12, 3) NOT NULL,
    reference_sale_id UUID,
    reversal_of_id UUID,
    notes TEXT,
    created_by_member_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (id, shop_id),
    CONSTRAINT fk_movement_product FOREIGN KEY (product_id, shop_id) 
        REFERENCES products(id, shop_id) ON DELETE RESTRICT,
    CONSTRAINT fk_movement_member FOREIGN KEY (created_by_member_id, shop_id) 
        REFERENCES shop_memberships(id, shop_id) ON DELETE RESTRICT,
    CONSTRAINT fk_movement_reversal FOREIGN KEY (reversal_of_id, shop_id) 
        REFERENCES inventory_movements(id, shop_id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS worker_activity_logs (
    id UUID DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    member_id UUID NOT NULL,
    action_type VARCHAR(100) NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    ip_address INET,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (id, shop_id),
    CONSTRAINT fk_activity_member FOREIGN KEY (member_id, shop_id) 
        REFERENCES shop_memberships(id, shop_id) ON DELETE RESTRICT
);

-- 6. STRICT IMMUTABILITY TRIGGERS
CREATE OR REPLACE FUNCTION enforce_strict_immutability()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Hard Security Violation: Records in % are completely immutable and cannot be updated or deleted. You must record a compensating reversal entry.', TG_TABLE_NAME;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_immutable_ledger_entries ON ledger_entries;
CREATE TRIGGER trg_immutable_ledger_entries
    BEFORE UPDATE OR DELETE ON ledger_entries
    FOR EACH ROW
    EXECUTE FUNCTION enforce_strict_immutability();

DROP TRIGGER IF EXISTS trg_immutable_stock_movements ON stock_movements;
CREATE TRIGGER trg_immutable_stock_movements
    BEFORE UPDATE OR DELETE ON stock_movements
    FOR EACH ROW
    EXECUTE FUNCTION enforce_strict_immutability();

DROP TRIGGER IF EXISTS trg_immutable_worker_activity_logs ON worker_activity_logs;
CREATE TRIGGER trg_immutable_worker_activity_logs
    BEFORE UPDATE OR DELETE ON worker_activity_logs
    FOR EACH ROW
    EXECUTE FUNCTION enforce_strict_immutability();

-- 7. ROW-LEVEL SECURITY & PERMISSION ENGINE
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_activity_logs ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION get_active_membership(target_shop_id UUID)
RETURNS TABLE (
    membership_id UUID,
    m_type member_type,
    perms JSONB
) STABLE SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT sm.id, sm.member_type, sm.permissions
    FROM shop_memberships sm
    WHERE sm.shop_id = target_shop_id
      AND sm.is_active = TRUE
      AND (
          sm.user_id = auth.uid() 
          OR sm.id = NULLIF(current_setting('request.jwt.claims', true)::jsonb ->> 'member_id', '')::uuid
      );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION has_shop_permission(target_shop_id UUID, required_permission TEXT)
RETURNS BOOLEAN STABLE SECURITY DEFINER AS $$
DECLARE
    v_type member_type;
    v_perms JSONB;
BEGIN
    SELECT m_type, perms INTO v_type, v_perms 
    FROM get_active_membership(target_shop_id) 
    LIMIT 1;

    IF v_type IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Owner maintains absolute access
    IF v_type = 'owner' THEN
        RETURN TRUE;
    END IF;

    -- Worker checked against assigned action array
    RETURN v_perms ? required_permission;
END;
$$ LANGUAGE plpgsql;

-- RLS POLICIES FOR CUSTOMERS
DROP POLICY IF EXISTS "customers_read" ON customers;
CREATE POLICY "customers_read" ON customers FOR SELECT USING (
    has_shop_permission(shop_id, 'customers:view')
);

DROP POLICY IF EXISTS "customers_write" ON customers;
CREATE POLICY "customers_write" ON customers FOR ALL USING (
    has_shop_permission(shop_id, 'customers:manage')
);

-- RLS POLICIES FOR PRODUCTS & INVENTORY
DROP POLICY IF EXISTS "products_read" ON products;
CREATE POLICY "products_read" ON products FOR SELECT USING (
    has_shop_permission(shop_id, 'inventory:view')
);

DROP POLICY IF EXISTS "products_write" ON products;
CREATE POLICY "products_write" ON products FOR ALL USING (
    has_shop_permission(shop_id, 'inventory:adjust')
);

-- RLS POLICIES FOR SALES
DROP POLICY IF EXISTS "sales_read" ON sales;
CREATE POLICY "sales_read" ON sales FOR SELECT USING (
    has_shop_permission(shop_id, 'sales:view')
);

DROP POLICY IF EXISTS "sales_insert" ON sales;
CREATE POLICY "sales_insert" ON sales FOR INSERT WITH CHECK (
    has_shop_permission(shop_id, 'sales:create')
);

-- RLS POLICIES FOR FINANCIAL LEDGER
DROP POLICY IF EXISTS "ledger_read" ON ledger_entries;
CREATE POLICY "ledger_read" ON ledger_entries FOR SELECT USING (
    has_shop_permission(shop_id, 'ledger:view')
);

DROP POLICY IF EXISTS "ledger_insert" ON ledger_entries;
CREATE POLICY "ledger_insert" ON ledger_entries FOR INSERT WITH CHECK (
    has_shop_permission(shop_id, 'ledger:create')
);

-- RLS POLICIES FOR AUDIT & WORKER LOGS
DROP POLICY IF EXISTS "audit_logs_owner_only" ON worker_activity_logs;
CREATE POLICY "audit_logs_owner_only" ON worker_activity_logs FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM shop_memberships sm 
        WHERE sm.shop_id = worker_activity_logs.shop_id 
          AND sm.user_id = auth.uid() 
          AND sm.member_type = 'owner'
    )
);

-- 8. ACID ATOMIC TRANSACTION PROCEDURES
CREATE OR REPLACE FUNCTION execute_credit_sale(
    p_shop_id UUID,
    p_customer_id UUID,
    p_member_id UUID,
    p_invoice_number VARCHAR,
    p_subtotal NUMERIC,
    p_discount NUMERIC,
    p_total NUMERIC,
    p_paid_amount NUMERIC,
    p_payment_method payment_method,
    p_items JSONB, -- Array of [{product_id, quantity, unit_price, cost_price, total_price}]
    p_notes TEXT
) RETURNS UUID AS $$
DECLARE
    v_sale_id UUID;
    v_balance NUMERIC;
    v_cust_balance NUMERIC;
    v_cust_limit NUMERIC;
    v_item RECORD;
    v_current_stock NUMERIC;
    v_resulting_stock NUMERIC;
BEGIN
    v_balance := p_total - p_paid_amount;

    -- Verify worker/user has sales:create permission
    IF NOT has_shop_permission(p_shop_id, 'sales:create') THEN
        RAISE EXCEPTION 'Authorization Error: Missing sales:create permission';
    END IF;

    -- Check customer existence and acquire row lock
    SELECT current_balance, credit_limit 
    INTO v_cust_balance, v_cust_limit
    FROM customers 
    WHERE id = p_customer_id AND shop_id = p_shop_id 
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invalid customer identifier for this shop';
    END IF;

    -- Enforce credit limit if balance increases
    IF v_cust_limit > 0 AND (v_cust_balance + v_balance) > v_cust_limit THEN
        RAISE EXCEPTION 'Transaction Rejected: Credit limit of % exceeded. Projected: %', 
            v_cust_limit, (v_cust_balance + v_balance);
    END IF;

    -- 1. Create Sale Record
    INSERT INTO sales (
        shop_id, customer_id, created_by_member_id, invoice_number,
        subtotal, discount_amount, total_amount, paid_amount, balance_amount,
        payment_method, notes
    ) VALUES (
        p_shop_id, p_customer_id, p_member_id, p_invoice_number,
        p_subtotal, p_discount, p_total, p_paid_amount, v_balance,
        p_payment_method, p_notes
    ) RETURNING id INTO v_sale_id;

    -- 2. Process Line Items and Inventory Movements
    FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(
        product_id UUID, quantity NUMERIC, unit_price NUMERIC, cost_price NUMERIC, total_price NUMERIC
    )
    LOOP
        -- Lock product row
        SELECT current_stock INTO v_current_stock 
        FROM products 
        WHERE id = v_item.product_id AND shop_id = p_shop_id 
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Product % not found in this shop', v_item.product_id;
        END IF;

        v_resulting_stock := v_current_stock - v_item.quantity;

        -- Record sale item
        INSERT INTO sale_items (sale_id, shop_id, product_id, quantity, unit_price, cost_price, total_price)
        VALUES (v_sale_id, p_shop_id, v_item.product_id, v_item.quantity, v_item.unit_price, v_item.cost_price, v_item.total_price);

        -- Update stock cache
        UPDATE products 
        SET current_stock = v_resulting_stock, updated_at = NOW() 
        WHERE id = v_item.product_id AND shop_id = p_shop_id;

        -- Record immutable stock movement
        INSERT INTO inventory_movements (
            shop_id, product_id, movement_type, quantity_delta, resulting_stock,
            reference_sale_id, created_by_member_id
        ) VALUES (
            p_shop_id, v_item.product_id, 'sale', -v_item.quantity, v_resulting_stock,
            v_sale_id, p_member_id
        );
    END LOOP;

    -- 3. Sync Khatta Ledger
    IF v_balance > 0 THEN
        -- Add Udhaar debit to ledger
        INSERT INTO ledger_entries (
            shop_id, customer_id, entry_type, debit, credit,
            running_balance, reference_sale_id, notes, created_by_member_id
        ) VALUES (
            p_shop_id, p_customer_id, 'credit_sale', v_balance, 0.00,
            v_cust_balance + v_balance, v_sale_id, 'Credit Sale: ' || p_invoice_number, p_member_id
        );

        -- Update customer balance cache
        UPDATE customers 
        SET current_balance = current_balance + v_balance, updated_at = NOW() 
        WHERE id = p_customer_id AND shop_id = p_shop_id;
    END IF;

    -- 4. Audit Log
    INSERT INTO worker_activity_logs (shop_id, member_id, action_type, metadata)
    VALUES (
        p_shop_id, p_member_id, 'SALE_CREATED',
        jsonb_build_object('sale_id', v_sale_id, 'total', p_total, 'credit', v_balance)
    );

    RETURN v_sale_id;
END;
$$ LANGUAGE plpgsql;

-- 9. SECURE WORKER AUTHENTICATION RPC
CREATE OR REPLACE FUNCTION verify_worker_login(
    p_shop_id UUID,
    p_phone VARCHAR,
    p_pin VARCHAR
) RETURNS TABLE (
    token_member_id UUID,
    worker_name VARCHAR,
    permissions JSONB
) SECURITY DEFINER AS $$
DECLARE
    v_member RECORD;
BEGIN
    SELECT id, worker_name, pin_hash, permissions, is_active
    INTO v_member
    FROM shop_memberships
    WHERE shop_id = p_shop_id 
      AND worker_phone = p_phone 
      AND member_type = 'worker';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Authentication Failed: Invalid shop or phone number';
    END IF;

    IF NOT v_member.is_active THEN
        RAISE EXCEPTION 'Account Inactive: Activation required by shop owner';
    END IF;

    IF v_member.pin_hash != crypt(p_pin, v_member.pin_hash) THEN
        RAISE EXCEPTION 'Authentication Failed: Incorrect security PIN';
    END IF;

    -- Audit log login
    INSERT INTO worker_activity_logs (shop_id, member_id, action_type, metadata)
    VALUES (p_shop_id, v_member.id, 'WORKER_LOGIN', jsonb_build_object('timestamp', NOW()));

    RETURN QUERY SELECT v_member.id, v_member.worker_name, v_member.permissions;
END;
$$ LANGUAGE plpgsql;
