-- Enums
CREATE TYPE public.app_role AS ENUM ('admin','owner','tenant');
CREATE TYPE public.application_stage AS ENUM ('new','contacted','approved','rejected');

-- Profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  phone text,
  email text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_approved(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = _user_id AND status = 'approved')
$$;

CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "roles read" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- New user bootstrap: first ever account becomes approved admin+owner
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE first_user boolean;
BEGIN
  SELECT NOT EXISTS (SELECT 1 FROM public.profiles) INTO first_user;
  INSERT INTO public.profiles (id, full_name, phone, email, status)
  VALUES (NEW.id,
          COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
          NEW.raw_user_meta_data->>'phone',
          NEW.email,
          CASE WHEN first_user THEN 'approved' ELSE 'pending' END);
  IF first_user THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id,'admin'), (NEW.id,'owner');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id,'owner');
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Properties
CREATE TABLE public.properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  location text,
  type text,
  status text NOT NULL DEFAULT 'Active',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.properties TO authenticated;
GRANT ALL ON public.properties TO service_role;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.can_manage_property(_property_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.properties p
    WHERE p.id = _property_id
      AND (p.owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'))
  )
$$;

CREATE POLICY "properties owner all" ON public.properties FOR ALL TO authenticated
  USING ((owner_id = auth.uid() OR public.has_role(auth.uid(),'admin')) AND public.is_approved(auth.uid()))
  WITH CHECK ((owner_id = auth.uid() OR public.has_role(auth.uid(),'admin')) AND public.is_approved(auth.uid()));

CREATE TABLE public.units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  number text NOT NULL,
  bedrooms int,
  rent numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'vacant',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.units TO authenticated;
GRANT ALL ON public.units TO service_role;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
CREATE POLICY "units via property" ON public.units FOR ALL TO authenticated
  USING (public.can_manage_property(property_id)) WITH CHECK (public.can_manage_property(property_id));

-- Application links
CREATE TABLE public.application_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.application_links TO authenticated;
GRANT ALL ON public.application_links TO service_role;
ALTER TABLE public.application_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "links via property" ON public.application_links FOR ALL TO authenticated
  USING (public.can_manage_property(property_id)) WITH CHECK (public.can_manage_property(property_id));

-- Applications
CREATE TABLE public.applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  unit_id uuid REFERENCES public.units(id) ON DELETE SET NULL,
  link_id uuid REFERENCES public.application_links(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  phone text NOT NULL,
  email text,
  national_id text,
  date_of_birth date,
  gender text,
  occupants int,
  move_in_date date,
  lease_months int,
  notes text,
  stage public.application_stage NOT NULL DEFAULT 'new',
  access_code text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.applications TO authenticated;
GRANT ALL ON public.applications TO service_role;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "applications via property" ON public.applications FOR ALL TO authenticated
  USING (public.can_manage_property(property_id)) WITH CHECK (public.can_manage_property(property_id));

-- Documents
CREATE TABLE public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  kind text NOT NULL,
  file_path text NOT NULL,
  original_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO authenticated;
GRANT ALL ON public.documents TO service_role;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "documents via property" ON public.documents FOR ALL TO authenticated
  USING (public.can_manage_property(property_id)) WITH CHECK (public.can_manage_property(property_id));

-- Leases
CREATE TABLE public.leases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  unit_id uuid NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  application_id uuid REFERENCES public.applications(id) ON DELETE SET NULL,
  tenant_name text NOT NULL,
  tenant_phone text,
  rent numeric NOT NULL DEFAULT 0,
  start_date date,
  lease_months int,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leases TO authenticated;
GRANT ALL ON public.leases TO service_role;
ALTER TABLE public.leases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "leases via property" ON public.leases FOR ALL TO authenticated
  USING (public.can_manage_property(property_id)) WITH CHECK (public.can_manage_property(property_id));

-- Payments
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  unit_id uuid REFERENCES public.units(id) ON DELETE SET NULL,
  lease_id uuid REFERENCES public.leases(id) ON DELETE SET NULL,
  tenant_name text,
  amount numeric NOT NULL DEFAULT 0,
  method text,
  reference text,
  paid_on date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'Paid',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payments via property" ON public.payments FOR ALL TO authenticated
  USING (public.can_manage_property(property_id)) WITH CHECK (public.can_manage_property(property_id));

-- Expenses
CREATE TABLE public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  category text NOT NULL DEFAULT 'Maintenance',
  description text,
  amount numeric NOT NULL DEFAULT 0,
  spent_on date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'Paid',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expenses TO authenticated;
GRANT ALL ON public.expenses TO service_role;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "expenses via property" ON public.expenses FOR ALL TO authenticated
  USING (public.can_manage_property(property_id)) WITH CHECK (public.can_manage_property(property_id));

-- Staff
CREATE TABLE public.staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  name text NOT NULL,
  role text,
  contact text,
  salary numeric DEFAULT 0,
  status text NOT NULL DEFAULT 'Active',
  assigned_on date,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff TO authenticated;
GRANT ALL ON public.staff TO service_role;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff via property" ON public.staff FOR ALL TO authenticated
  USING (public.can_manage_property(property_id)) WITH CHECK (public.can_manage_property(property_id));

-- Maintenance
CREATE TABLE public.maintenance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  unit_id uuid REFERENCES public.units(id) ON DELETE SET NULL,
  description text NOT NULL,
  contractor text,
  cost numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'In progress',
  logged_on date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.maintenance TO authenticated;
GRANT ALL ON public.maintenance TO service_role;
ALTER TABLE public.maintenance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "maintenance via property" ON public.maintenance FOR ALL TO authenticated
  USING (public.can_manage_property(property_id)) WITH CHECK (public.can_manage_property(property_id));

-- Public helper: read an application form by token
CREATE OR REPLACE FUNCTION public.get_application_form(_token text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'token', l.token,
    'property_name', p.name,
    'location', p.location,
    'property_type', p.type,
    'unit_number', u.number,
    'bedrooms', u.bedrooms,
    'rent', u.rent
  ) INTO result
  FROM public.application_links l
  JOIN public.properties p ON p.id = l.property_id
  JOIN public.units u ON u.id = l.unit_id
  WHERE l.token = _token AND l.active = true;
  RETURN result;
END; $$;
GRANT EXECUTE ON FUNCTION public.get_application_form(text) TO anon, authenticated;

-- Public helper: submit an application
CREATE OR REPLACE FUNCTION public.submit_application(
  _token text, _full_name text, _phone text, _email text, _national_id text,
  _date_of_birth date, _gender text, _occupants int, _move_in_date date,
  _lease_months int, _notes text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE l public.application_links; new_id uuid; code text;
BEGIN
  SELECT * INTO l FROM public.application_links WHERE token = _token AND active = true;
  IF l.id IS NULL THEN RAISE EXCEPTION 'This application link is not available'; END IF;
  IF coalesce(trim(_full_name),'') = '' OR coalesce(trim(_phone),'') = '' THEN
    RAISE EXCEPTION 'Name and phone are required';
  END IF;
  code := encode(gen_random_bytes(8),'hex');
  INSERT INTO public.applications (property_id, unit_id, link_id, full_name, phone, email,
    national_id, date_of_birth, gender, occupants, move_in_date, lease_months, notes, access_code)
  VALUES (l.property_id, l.unit_id, l.id, trim(_full_name), trim(_phone), nullif(trim(coalesce(_email,'')),''),
    nullif(trim(coalesce(_national_id,'')),''), _date_of_birth, nullif(_gender,''), _occupants, _move_in_date,
    _lease_months, nullif(trim(coalesce(_notes,'')),''), code)
  RETURNING id INTO new_id;
  RETURN jsonb_build_object('id', new_id, 'access_code', code);
END; $$;
GRANT EXECUTE ON FUNCTION public.submit_application(text,text,text,text,text,date,text,int,date,int,text) TO anon, authenticated;

-- Public helper: applicant portal (documents page) lookup
CREATE OR REPLACE FUNCTION public.get_applicant_portal(_application_id uuid, _code text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'id', a.id,
    'full_name', a.full_name,
    'stage', a.stage,
    'property_name', p.name,
    'unit_number', u.number,
    'documents', COALESCE((SELECT jsonb_agg(jsonb_build_object('id', d.id, 'kind', d.kind, 'original_name', d.original_name, 'created_at', d.created_at) ORDER BY d.created_at)
                           FROM public.documents d WHERE d.application_id = a.id), '[]'::jsonb)
  ) INTO result
  FROM public.applications a
  JOIN public.properties p ON p.id = a.property_id
  LEFT JOIN public.units u ON u.id = a.unit_id
  WHERE a.id = _application_id AND a.access_code = _code;
  RETURN result;
END; $$;
GRANT EXECUTE ON FUNCTION public.get_applicant_portal(uuid,text) TO anon, authenticated;

-- Public helper: record an uploaded document for an applicant
CREATE OR REPLACE FUNCTION public.add_applicant_document(
  _application_id uuid, _code text, _kind text, _file_path text, _original_name text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE a public.applications; new_id uuid;
BEGIN
  SELECT * INTO a FROM public.applications WHERE id = _application_id AND access_code = _code;
  IF a.id IS NULL THEN RAISE EXCEPTION 'Invalid document link'; END IF;
  INSERT INTO public.documents (application_id, property_id, kind, file_path, original_name)
  VALUES (a.id, a.property_id, _kind, _file_path, _original_name)
  RETURNING id INTO new_id;
  RETURN new_id;
END; $$;
GRANT EXECUTE ON FUNCTION public.add_applicant_document(uuid,text,text,text,text) TO anon, authenticated;

CREATE INDEX ON public.units (property_id);
CREATE INDEX ON public.applications (property_id, stage);
CREATE INDEX ON public.payments (property_id, paid_on);
CREATE INDEX ON public.expenses (property_id, spent_on);