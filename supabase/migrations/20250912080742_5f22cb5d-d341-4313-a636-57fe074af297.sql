-- Create beaches table
CREATE TABLE public.beaches (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    place_text TEXT NOT NULL, -- e.g., "Chania, Crete"
    description TEXT,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    
    -- Amenities and features
    organized BOOLEAN NOT NULL DEFAULT false,
    blue_flag BOOLEAN NOT NULL DEFAULT false,
    parking TEXT CHECK (parking IN ('none', 'limited', 'ample')),
    
    -- Amenities as array
    amenities TEXT[] DEFAULT '{}',
    
    -- Photos
    photo_url TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create profiles table for admin user
CREATE TABLE public.profiles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.beaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for beaches
-- Public can only see ACTIVE beaches
CREATE POLICY "Public can view active beaches" 
ON public.beaches 
FOR SELECT 
USING (status = 'ACTIVE');

-- Create security definer function to check admin role
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Admin can do everything with beaches
CREATE POLICY "Admins can insert beaches" 
ON public.beaches 
FOR INSERT 
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update beaches" 
ON public.beaches 
FOR UPDATE 
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can delete beaches" 
ON public.beaches 
FOR DELETE 
TO authenticated
USING (public.is_admin());

-- Admins can see all beaches (including inactive)
CREATE POLICY "Admins can view all beaches" 
ON public.beaches 
FOR SELECT 
TO authenticated
USING (public.is_admin());

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (user_id = auth.uid());

-- Insert admin profile (will be linked when admin user signs up)
-- Note: This will be completed after the admin user is created in auth.users

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_beaches_updated_at
    BEFORE UPDATE ON public.beaches
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some sample beaches data
INSERT INTO public.beaches (name, place_text, description, latitude, longitude, organized, blue_flag, parking, amenities, photo_url) VALUES
('Balos Lagoon', 'Kissamos, Crete', 'Stunning lagoon with turquoise waters and pink sand', 35.5917, 23.5858, false, false, 'none', '{"snorkeling", "photography"}', null),
('Myrtos Beach', 'Kefalonia, Ionian Islands', 'Dramatic white pebble beach with crystal clear waters', 38.3431, 20.5553, true, true, 'ample', '{"sunbeds", "umbrellas", "taverna", "water_sports"}', null),
('Navagio Beach', 'Zakynthos, Ionian Islands', 'Famous shipwreck beach with stunning cliffs', 37.8598, 20.6243, false, false, 'none', '{"photography", "boat_trips"}', null),
('Red Beach', 'Santorini, Cyclades', 'Unique red volcanic sand beach', 36.3569, 25.3956, false, false, 'limited', '{"snorkeling", "photography"}', null),
('Paradise Beach', 'Mykonos, Cyclades', 'Lively beach with beach bars and water sports', 37.4136, 25.3442, true, false, 'ample', '{"sunbeds", "umbrellas", "beach_bar", "water_sports", "music"}', null),
('Koukounaries Beach', 'Skiathos, Sporades', 'Golden sand beach surrounded by pine forest', 39.1353, 23.4444, true, true, 'ample', '{"sunbeds", "umbrellas", "taverna", "water_sports"}', null),
('Voidokilia Beach', 'Messinia, Peloponnese', 'Perfect semicircle bay with pristine waters', 36.9530, 21.9675, false, false, 'limited', '{"hiking", "birdwatching", "photography"}', null),
('Lalaria Beach', 'Skiathos, Sporades', 'White pebble beach accessible only by boat', 39.2094, 23.5336, false, false, 'none', '{"snorkeling", "photography", "boat_trips"}', null),
('Sarakiniko Beach', 'Milos, Cyclades', 'Lunar-like white cliffs and turquoise waters', 36.7377, 24.4458, false, false, 'limited', '{"photography", "cliff_jumping", "snorkeling"}', null),
('Egremni Beach', 'Lefkada, Ionian Islands', 'Dramatic beach with white cliffs and blue waters', 38.6394, 20.5647, false, false, 'none', '{"hiking", "photography"}', null),
('Tsambika Beach', 'Rhodes, Dodecanese', 'Golden sand beach with shallow waters', 36.2244, 28.1358, true, true, 'ample', '{"sunbeds", "umbrellas", "taverna", "water_sports", "family_friendly"}', null),
('Platys Gialos', 'Sifnos, Cyclades', 'Protected bay with traditional fishing boats', 36.9739, 24.6358, true, false, 'limited', '{"sunbeds", "umbrellas", "taverna", "fishing"}', null);