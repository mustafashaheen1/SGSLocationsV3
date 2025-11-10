'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, ChevronDown, X } from 'lucide-react';
import { supabase, Property } from '@/lib/supabase';
import Link from 'next/link';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Scrollbar, FreeMode } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/scrollbar';
import 'swiper/css/free-mode';

const filterCategories = {
  area: {
    name: 'Area',
    hasSearch: true,
    options: [
      'ACTON', 'ADAMS DISTRICT', 'AGOURA HILLS', 'AGUA DULCE', 'ALHAMBRA',
      'ALTADENA', 'ARCADIA', 'ATWATER VILLAGE', 'AZUZA', 'BALBOA',
      'BALDWIN HILLS', 'BEL AIR', 'BEVERLY HILLS', 'BRADBURY', 'BRENTWOOD',
      'BRIDGEPORT', 'BURBANK', 'CALABASAS', 'CANYON COUNTRY', 'CARSON',
      'CASTAIC', 'CENTRAL LA', 'CENTURY CITY', 'CHAPMAN WOODS', 'CHATSWORTH',
      'CHEVIOT HILLS', 'COMMERCE', 'COMPTON', 'COUNTRY CLUB PARK', 'CULVER CITY',
      'DOWNEY', 'DOWNTOWN', 'EAGLE ROCK', 'EAST LA', 'ECHO PARK', 'EL SEGUNDO',
      'ENCINO', 'FREEMONT PLACE', 'GARDENA', 'GLENDALE', 'GRANADA HILLS',
      'HANCOCK PARK', 'HAWTHORNE', 'HERMOSA BEACH', 'HIGHLAND PARK', 'HILLS',
      'HOLLYWOOD', 'HOLLYWOOD HILLS', 'HOLMBY HILLS', 'INDIAN SPRINGS', 'IRVINE',
      'LA CANADA', 'LA COUNTY PERMIT', 'LA CRESENTA', 'LA HABRA', 'LADERA HEIGHTS',
      'LONG BEACH', 'LOS ANGELES', 'LOS FELIZ', 'MALIBU', 'MAR VISTA',
      'MARINA DEL REY', 'MID WILSHIRE', 'MISSION HILLS', 'MONROVIA', 'MONTECITO',
      'NEWHALL', 'NEWPORT BEACH', 'NORTH HILLS', 'NORTH HOLLYWOOD', 'NORTHRIDGE',
      'NORWALK', 'OJAI', 'ONTARIO', 'ORANGE COUNTY', 'OUT OF TMZ',
      'PACIFIC PALISADES', 'PALM SPRINGS', 'PALOS VERDES', 'PASADENA', 'POMONA',
      'RESEDA', 'SAN FERNANDO VALLEY', 'SAN GABRIEL VALLEY', 'SAN PEDRO',
      'SANTA BARBARA', 'SANTA CLARITA', 'SANTA MONICA', 'SANTA SUZANA', 'SAUGUS',
      'SHADOW HILLS', 'SHERMAN OAKS', 'SIERRA MADRE', 'SIGNAL HILL', 'SILVER LAKE',
      'SIMI VALLEY', 'SOMIS', 'SOUTH LA', 'SOUTH PASADENA', 'SOUTHEAST LA',
      'SOUTHGATE', 'STEVENSON RANCH', 'STUDIO CITY', 'SUN VALLEY', 'SUNLAND',
      'TARZANA', 'THOUSAND OAKS', 'TOLUCA LAKE', 'TOPANGA CANYON', 'TORRANCE',
      'VALENCIA', 'VALLEY VILLAGE', 'VAN NUYS', 'VENICE', 'VERNON', 'WEST COVINA',
      'WEST HILLS', 'WEST HOLLYWOOD', 'WEST LA', 'WEST VALLEY', 'WESTCHESTER',
      'WESTLAKE', 'WESTSIDE', 'WHITTIER', 'WOODLAND HILLS'
    ]
  },

  features: {
    name: 'Features',
    hasSearch: true,
    options: [
      '1 Story', '2 Story', '3 Story', 'Arbor', 'Astro Turf', 'Backyard BBQ',
      'Backyard Desert', 'Backyard Lawn', 'Backyard Native Plants', 'Backyard Pool',
      'Backyard Pond', 'Backyard View', 'Balcony', 'Bar', 'Basketball Court',
      'Bathroom', 'Bathroom Dark', 'Bathroom Modern', 'Bathroom Pink',
      'Bathroom Retro', 'Bathroom Vintage', 'Bathtub', 'Beach', 'Beach Cliff',
      'Beach House', 'Beach Sand', 'Beach View', 'Bedroom', 'Bedroom Bright',
      'Bedroom Colorful', 'Bedroom Mid-Century', 'Bedroom Modern', 'Bedroom Retro',
      'Bedroom Tropical', 'Bedroom Vintage', 'Biergarten', 'Bocce Court', 'Cabin',
      'Cabinetry Modern', 'Cabinetry Retro', 'Cabins', 'Carport', 'Cathedral Ceiling',
      'Ceiling', 'Ceiling Beams', 'Ceiling Cathedral', 'Ceiling Coffered',
      'Ceiling Modern', 'Ceiling Textured', 'Ceiling Vaulted', 'Ceiling Wood Beams',
      'Cocktail Lounge', 'Contemporary', 'Country', 'Courtyard', 'Deck',
      'Dining Room', 'Driveway', 'Driveway Brick', 'Driveway Circular',
      'Driveway Concrete', 'Driveway Gravel', 'Enclosed Patio', 'Fireplace',
      'Floors', 'Floors Brick', 'Floors Carpet', 'Floors Checkerboard',
      'Floors Concrete', 'Floors Dark Wood', 'Floors Hardwood', 'Floors Linoleum',
      'Floors Marble', 'Floors Parquet', 'Floors Slate', 'Floors Terrazzo',
      'Floors Tile', 'Floors White', 'Floors Wood', 'Fountain', 'Front Lawn',
      'Front Porch', 'Front Yard Desert', 'Front Yard Grass', 'Front Yard Gravel',
      'Front Yard Native Plants', 'Front Yard Rock', 'Furnished', 'Furnished Light',
      'Furnished Minimally', 'Furnished Unfurnished', 'Garage', 'Garage 1 Car',
      'Garage 2 Car', 'Garage 3 Car', 'Garage Detached', 'Garden', 'Garden Rose',
      'Garden Vegetable', 'Garden Zen', 'Gate', 'Gazebo', 'Golf Course',
      'Greenhouse', 'Grill', 'Guest House', 'Gym', 'Gym Home', 'Hedges',
      'Home Office', 'Home Theater', 'Hot Tub', 'In-Law Suite', 'Island Kitchen',
      'Jacuzzi', 'Kitchen', 'Kitchen Bright', 'Kitchen Colorful', 'Kitchen Dark',
      'Kitchen Farmhouse', 'Kitchen Galley', 'Kitchen Modern', 'Kitchen Open',
      'Kitchen Retro', 'Kitchen Vintage', 'Kitchen White', 'Lake', 'Lake House',
      'Lake View', 'Laundry Room', 'Library', 'Living Room', 'Living Room Bright',
      'Living Room Dark', 'Living Room Modern', 'Living Room Retro',
      'Living Room Traditional', 'Loft', 'Meditation Room', 'Mid-Century',
      'Modern', 'Mountain View', 'Music Room', 'Nursery', 'Office', 'Outdoor Shower',
      'Palm Trees', 'Parking', 'Parking Off-Street', 'Parking On-Street',
      'Parking Underground', 'Patio', 'Patio Balconies', 'Patio Covered',
      'Patio Enclosed', 'Patio Furniture', 'Patio Open', 'Patio Stone', 'Patio Wood',
      'Pergola', 'Play Structure', 'Playhouse', 'Pond', 'Pool', 'Pool Above Ground',
      'Pool Heated', 'Pool Infinity', 'Pool Indoor', 'Pool Kidney Shaped',
      'Pool Lap', 'Pool Natural', 'Pool Olympic', 'Pool Plunge', 'Pool Rectangular',
      'Pool Salt Water', 'Pool Spa', 'Putting Green', 'Ranch', 'Retro', 'Rooftop',
      'RV Parking', 'Sauna', 'Shower', 'Shuffleboard Court', 'Skylight',
      'Spa', 'Sports Court', 'Stables', 'Staircase', 'Staircase Curved',
      'Staircase Floating', 'Staircase Modern', 'Staircase Spiral', 'Steam Room',
      'Stone Walls', 'Storage', 'Studio', 'Study', 'Sunroom', 'Tennis Court',
      'Terrace', 'Theater Room', 'Tiki Bar', 'Traditional', 'Trailer', 'Treehouse',
      'Tropical', 'View', 'View City', 'View Desert', 'View Golf Course',
      'View Hills', 'View Lake', 'View Mountain', 'View Ocean', 'View Panoramic',
      'View Pool', 'View Sunset', 'View Valley', 'View Water', 'Vintage',
      'Volleyball Court', 'Walkway', 'Walls', 'Walls Brick', 'Walls Brick Exposed',
      'Walls Concrete', 'Walls Glass', 'Walls Mirrored', 'Walls Painted',
      'Walls Paneling', 'Walls Shiplap', 'Walls Stone', 'Walls Stucco',
      'Walls Textured', 'Walls Wallpaper', 'Walls White', 'Walls Wood',
      'Walls Wood Paneling', 'Water Feature', 'Wet Bar', 'Wine Cellar',
      'Wine Room', 'Windows', 'Windows Bay', 'Windows Casement', 'Windows Floor to Ceiling',
      'Windows French', 'Windows Large', 'Windows Lots of Natural Light',
      'Windows Picture', 'Windows Skylights', 'Windows Sliding Glass',
      'Windows Stained Glass', 'Workshop', 'Wrap Around Porch', 'Yard',
      'Yard Large', 'Yard Small', 'Zen Garden'
    ]
  },

  residential: {
    name: 'Residential',
    hasSearch: true,
    options: [
      '70s & 80s', '90s Modern', '90s Vibe', 'Americana', 'Americana 50s',
      'Americana Cape Cod', 'Americana Country', 'Americana Georgian Colonial',
      'Americana New England', 'Americana Traditional', 'Apartment', 'Art Deco',
      'Arts and Crafts', 'Bachelor Pad', 'Beach House', 'Bohemian', 'Bungalow',
      'Cape Cod', 'Castle', 'Chateau', 'Cliff House', 'Colonial', 'Condo',
      'Contemporary', 'Contemporary Clean Lines', 'Contemporary Glass & Steel',
      'Contemporary High Tech Modern', 'Cottage', 'Country', 'Craftsman',
      'Desert Modern', 'East Coast', 'Eclectic', 'Edwardian', 'Estate',
      'European', 'Farmhouse', 'Florida', 'French', 'French Country',
      'French Provincial', 'Georgian', 'Georgian Colonial', 'Greek Revival',
      'Guesthouse', 'High Rise', 'High Tech Modern', 'Historic', 'Hollywood Hills',
      'Industrial', 'Italian', 'Lake House', 'Loft', 'Log Cabin', 'Luxury',
      'Mansion', 'Masonry', 'Mediterranean', 'Mid Century', 'Mid West',
      'Minimalist', 'Modern', 'Modern A-Frame', 'Modern Architecture',
      'Modern Cube House', 'Modern Farmhouse', 'Modern Glass House',
      'Modern Minimalist', 'Modern Organic', 'Modern Rustic', 'Modernist',
      'Mountain', 'Mountain Cabin', 'Mountain House', 'Mountain Lodge',
      'New Construction', 'New England', 'New Orleans', 'Northwest', 'Penthouse',
      'Prairie Style', 'Ranch', 'Ranch Horse Property', 'Ranch Style', 'Retro',
      'Rustic', 'Rustic Modern', 'Scandinavian', 'Seaside', 'Spanish',
      'Spanish Colonial', 'Spanish Mediterranean', 'Spanish Revival', 'Split Level',
      'Storybook', 'Studio', 'Suburban', 'Townhouse', 'Traditional', 'Treehouse',
      'Tropical', 'Tudor', 'Tuscan', 'Urban', 'Victorian', 'Victorian Gothic',
      'Victorian Italianate', 'Victorian Queen Anne', 'Villa', 'Vintage'
    ]
  },

  commercial: {
    name: 'Commercial',
    hasSearch: true,
    options: [
      'Airplane', 'Airport', 'Airport Hangar', 'Airport Terminal', 'Alley',
      'Apartment Building', 'Aquarium', 'Arena', 'Art Gallery', 'Auditorium',
      'Bakery', 'Bank', 'Bar', 'Bar Dive', 'Bar Sports', 'Bar Wine', 'Barn',
      'Baseball Field', 'Basketball Court', 'Big Box Store', 'Bookstore',
      'Bowling Alley', 'Brewery', 'Bridge', 'Building Abandoned',
      'Building Government', 'Building High Rise', 'Building Historic',
      'Building Industrial', 'Building Medical', 'Building Mid Rise',
      'Building Office', 'Bus', 'Bus Depot', 'Bus Station', 'Butcher Shop',
      'Cafe', 'Cafeteria', 'Car Dealership', 'Car Wash', 'Casino', 'Cemetery',
      'Church', 'Cinema', 'City Hall', 'Classroom', 'Clinic', 'Club',
      'Club Country', 'Club Golf', 'Club Night', 'Club Yacht', 'Coffee Shop',
      'College Campus', 'Comedy Club', 'Community Center', 'Concert Hall',
      'Conference Center', 'Construction Site', 'Convention Center', 'Convenience Store',
      'Courthouse', 'Deli', 'Department Store', 'Desert', 'Detention Center',
      'Diner', 'Diner 50s', 'Diner Classic', 'Diner Retro', 'Distillery',
      'Doctor Office', 'Dock', 'Dorm', 'Downtown', 'Drive In', 'Dry Cleaner',
      'Elementary School', 'Embassy', 'Factory', 'Factory Abandoned', 'Farmers Market',
      'Fast Food', 'Ferry Terminal', 'Field', 'Fire Station', 'Fish Market',
      'Flea Market', 'Food Court', 'Food Hall', 'Food Truck', 'Football Field',
      'Forest', 'Fort', 'Funeral Home', 'Furniture Store', 'Gallery', 'Garage',
      'Garage Auto Repair', 'Garage Parking', 'Gas Station', 'Golf Course',
      'Grocery Store', 'Gym', 'Hair Salon', 'Hardware Store', 'High School',
      'Highway', 'Hospital', 'Hostel', 'Hotel', 'Hotel Boutique', 'Hotel Luxury',
      'Hotel Resort', 'House of Worship', 'Ice Cream Shop', 'Ice Rink',
      'Industrial', 'Industrial Complex', 'Industrial Warehouse', 'Jazz Club',
      'Jewelry Store', 'Junkyard', 'Laboratory', 'Laundromat', 'Library',
      'Lighthouse', 'Liquor Store', 'Loading Dock', 'Lobby', 'Locker Room',
      'Loft', 'Lumberyard', 'Mall', 'Mall Shopping Center', 'Mall Strip',
      'Marina', 'Market', 'Meat Packing', 'Medical Center', 'Middle School',
      'Military Base', 'Mill', 'Miniature Golf', 'Motel', 'Mosque', 'Movie Theater',
      'Museum', 'Music Venue', 'News Stand', 'Nightclub', 'Nursing Home',
      'Observatory', 'Office', 'Office Building', 'Office Cubicles', 'Office Modern',
      'Office Open Plan', 'Office Traditional', 'Opera House', 'Optometrist',
      'Orphanage', 'Outlet Mall', 'Paint Store', 'Park', 'Parking Garage',
      'Parking Lot', 'Pawn Shop', 'Pet Store', 'Pharmacy', 'Pier', 'Pizza Place',
      'Police Station', 'Post Office', 'Power Plant', 'Prison', 'Public Pool',
      'Public Square', 'Quarry', 'Race Track', 'Railroad', 'Recording Studio',
      'Recycling Center', 'Refinery', 'Restaurant', 'Restaurant Asian',
      'Restaurant Fast Food', 'Restaurant Fine Dining', 'Restaurant French',
      'Restaurant Italian', 'Restaurant Mexican', 'Restaurant Seafood',
      'Retail Store', 'Roller Rink', 'Rooftop', 'Salon', 'School', 'Shipyard',
      'Shooting Range', 'Shopping Center', 'Skate Park', 'Ski Lodge', 'Ski Resort',
      'Skyscraper', 'Smoke Shop', 'Spa', 'Stadium', 'Storage Facility', 'Strip Club',
      'Strip Mall', 'Studio', 'Studio Dance', 'Studio Film', 'Studio Photo',
      'Studio Recording', 'Studio TV', 'Studio Yoga', 'Subway', 'Subway Station',
      'Supermarket', 'Surf Shop', 'Synagogue', 'Tattoo Parlor', 'Tavern',
      'Temple', 'Tennis Club', 'Terminal', 'Terminal Bus', 'Terminal Train',
      'Theater', 'Theater Drive-In', 'Theater Performing Arts', 'Thrift Store',
      'Toy Store', 'Train', 'Train Station', 'Train Yard', 'Tunnel', 'University',
      'Vet Clinic', 'Warehouse', 'Warehouse Abandoned', 'Warehouse Converted',
      'Warehouse Industrial', 'Water Tower', 'Winery', 'Workshop', 'Yacht Club',
      'Zoo'
    ]
  }
};

interface FilterCategory {
  name: string;
  hasSearch: boolean;
  options: string[];
}

function generatePropertyImages(propertyId: string | number, count: number = 50): string[] {
  const images: string[] = [];
  for (let i = 0; i < count; i++) {
    images.push(`https://picsum.photos/seed/${propertyId}-${i}/800/600`);
  }
  return images;
}

function PropertyCard({ property }: { property: Property }) {
  const router = useRouter();
  const [showLightbox, setShowLightbox] = useState(false);
  const swiperRef = useRef<any>(null);

  const images = generatePropertyImages(property.id, 50);

  return (
    <>
      <article className="il-search-result">
        <div className="il-react-carousel">
          <div className="swiper-container-wrapper" style={{ position: 'relative' }}>
            <Swiper
              modules={[Navigation, Scrollbar, FreeMode]}
              spaceBetween={3}
              slidesPerView={1}
              freeMode={false}
              loop={false}
              navigation={{
                prevEl: `.nav-prev-${property.id}`,
                nextEl: `.nav-next-${property.id}`,
              }}
              scrollbar={{
                el: `.scrollbar-${property.id}`,
                draggable: true,
                dragClass: 'swiper-scrollbar-drag',
              }}
              onSwiper={(swiper) => {
                swiperRef.current = swiper;
              }}
              style={{
                width: '100%',
                height: '300px',
              }}
            >
              {images.map((img, idx) => (
                <SwiperSlide key={idx}>
                  <Link href={`/property/${property.id}`}>
                    <img
                      src={img}
                      alt={`${property.name} - ${idx + 1}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block'
                      }}
                      onError={(e) => {
                        e.currentTarget.src = 'https://via.placeholder.com/400x300';
                      }}
                    />
                  </Link>
                </SwiperSlide>
              ))}
            </Swiper>

            <div className={`swiper-button-prev nav-prev-${property.id}`}></div>
            <div className={`swiper-button-next nav-next-${property.id}`}></div>

            <div className={`swiper-scrollbar scrollbar-${property.id}`}></div>
          </div>

          <div style={{ padding: '12px 0', position: 'relative', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div style={{ flex: 1 }}>
              <h5 style={{
                fontSize: '18px',
                fontWeight: 400,
                marginBottom: '4px',
                fontFamily: 'acumin-pro-wide, sans-serif',
                margin: 0
              }}>
                <Link
                  href={`/property/${property.id}`}
                  style={{ color: '#212529', textDecoration: 'none' }}
                >
                  {property.name}
                </Link>
              </h5>
              <p style={{
                fontSize: '14px',
                color: '#6c757d',
                marginBottom: 0,
                fontFamily: 'acumin-pro-wide, sans-serif',
                margin: 0
              }}>
                {property.city}
              </p>
            </div>

            <button
              onClick={() => setShowLightbox(true)}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                marginLeft: '12px',
                flexShrink: 0
              }}
            >
              <svg
                width="25"
                height="25"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 512 512"
                style={{ color: 'rgb(225, 25, 33)', display: 'block' }}
              >
                <path
                  fill="currentColor"
                  d="M319.8 204v8c0 6.6-5.4 12-12 12h-84v84c0 6.6-5.4 12-12 12h-8c-6.6 0-12-5.4-12-12v-84h-84c-6.6 0-12-5.4-12-12v-8c0-6.6 5.4-12 12-12h84v-84c0-6.6 5.4-12 12-12h8c6.6 0 12 5.4 12 12v84h84c6.6 0 12 5.4 12 12zm188.5 293L497 508.3c-4.7 4.7-12.3 4.7-17 0l-129-129c-2.3-2.3-3.5-5.3-3.5-8.5v-8.5C310.6 395.7 261.7 416 208 416 93.8 416 1.5 324.9 0 210.7-1.5 93.7 93.7-1.5 210.7 0 324.9 1.5 416 93.8 416 208c0 53.7-20.3 102.6-53.7 139.5h8.5c3.2 0 6.2 1.3 8.5 3.5l129 129c4.7 4.7 4.7 12.3 0 17zM384 208c0-97.3-78.7-176-176-176S32 110.7 32 208s78.7 176 176 176 176-78.7 176-176z"
                ></path>
              </svg>
            </button>
          </div>
        </div>
      </article>

      {showLightbox && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'white',
            zIndex: 9999,
            overflow: 'auto',
            padding: '40px 20px'
          }}
          onClick={() => setShowLightbox(false)}
        >
          <button
            onClick={() => setShowLightbox(false)}
            style={{
              position: 'fixed',
              top: '20px',
              right: '20px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              zIndex: 10001
            }}
          >
            <X size={32} color="#212529" strokeWidth={2} />
          </button>

          <div onClick={(e) => e.stopPropagation()} style={{ maxWidth: '1400px', margin: '0 auto' }}>
            <h2 style={{
              fontSize: '32px',
              fontWeight: 400,
              color: '#212529',
              marginBottom: '30px',
              fontFamily: 'acumin-pro-wide, sans-serif'
            }}>
              {property.name}
            </h2>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
              gap: '16px'
            }}>
              {images.map((img, idx) => (
                <div key={idx} style={{ textAlign: 'center' }}>
                  <img
                    src={img}
                    alt={`${property.name} ${idx + 1}`}
                    style={{
                      width: '100%',
                      height: '140px',
                      objectFit: 'cover',
                      cursor: 'pointer',
                      borderRadius: '4px',
                      marginBottom: '8px'
                    }}
                    onClick={() => router.push(`/property/${property.id}`)}
                  />
                  <div style={{
                    fontSize: '14px',
                    color: '#6c757d',
                    fontFamily: 'acumin-pro-wide, sans-serif'
                  }}>
                    {idx + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState<{ category: string; values: string[] }[]>([]);
  const [searchTerms, setSearchTerms] = useState<{ [key: string]: string }>({});
  const dropdownRef = useRef<HTMLDivElement>(null);
  const ITEMS_PER_PAGE = 24;

  const loadMoreProperties = async () => {
    if (loading || !hasMore) return;

    setLoading(true);

    try {
      const from = (page - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      const query = searchParams.get('q');

      let supabaseQuery = supabase
        .from('properties')
        .select('*')
        .eq('status', 'active')
        .range(from, to);

      if (query) {
        supabaseQuery = supabaseQuery.ilike('title', `%${query}%`);
      }

      const areaFilters = activeFilters.find(f => f.category === 'Area');
      if (areaFilters && areaFilters.values.length > 0) {
        supabaseQuery = supabaseQuery.in('city', areaFilters.values);
      }

      const featuresFilters = activeFilters.find(f => f.category === 'Features');
      if (featuresFilters && featuresFilters.values.length > 0) {
        supabaseQuery = supabaseQuery.overlaps('features', featuresFilters.values);
      }

      const residentialFilters = activeFilters.find(f => f.category === 'Residential');
      if (residentialFilters && residentialFilters.values.length > 0) {
        supabaseQuery = supabaseQuery.overlaps('categories', residentialFilters.values);
      }

      const commercialFilters = activeFilters.find(f => f.category === 'Commercial');
      if (commercialFilters && commercialFilters.values.length > 0) {
        supabaseQuery = supabaseQuery.overlaps('categories', commercialFilters.values);
      }

      const { data, error } = await supabaseQuery;

      if (error) throw error;

      if (data && data.length > 0) {
        setProperties(prev => [...prev, ...data]);
        setPage(prev => prev + 1);

        if (data.length < ITEMS_PER_PAGE) {
          setHasMore(false);
        }
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading properties:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setProperties([]);
    setPage(1);
    setHasMore(true);
  }, [searchParams, activeFilters]);

  useEffect(() => {
    if (page === 1 && properties.length === 0 && !loading) {
      loadMoreProperties();
    }
  }, [page, properties.length]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      if (scrollTop + windowHeight >= documentHeight - 500) {
        if (!loading && hasMore) {
          loadMoreProperties();
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loading, hasMore]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleFilter = (category: string, value: string) => {
    setActiveFilters(prev => {
      const existingFilter = prev.find(f => f.category === category);
      if (existingFilter) {
        const newValues = existingFilter.values.includes(value)
          ? existingFilter.values.filter(v => v !== value)
          : [...existingFilter.values, value];

        if (newValues.length === 0) {
          return prev.filter(f => f.category !== category);
        }

        return prev.map(f =>
          f.category === category ? { ...f, values: newValues } : f
        );
      }
      return [...prev, { category, values: [value] }];
    });
  };

  const isFilterActive = (category: string, value: string) => {
    const filter = activeFilters.find(f => f.category === category);
    return filter ? filter.values.includes(value) : false;
  };

  const removeFilterValue = (category: string, value: string) => {
    toggleFilter(category, value);
    window.scrollTo(0, 0);
  };

  const clearCategoryFilters = (category: string) => {
    setActiveFilters(prev => prev.filter(f => f.category !== category));
    window.scrollTo(0, 0);
  };

  const clearAllFilters = () => {
    setActiveFilters([]);
    window.scrollTo(0, 0);
  };

  const getFilteredOptions = (categoryKey: string, options: string[]) => {
    const searchTerm = searchTerms[categoryKey]?.toLowerCase() || '';
    if (!searchTerm) return options;
    return options.filter(option => option.toLowerCase().includes(searchTerm));
  };

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@200;300;400;500;600&display=swap');

        .search-page {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          background: #fff;
          min-height: 100vh;
          padding-top: 60px;
        }

        .filter-bar {
          background: white;
          border-bottom: 1px solid #e5e5e5;
          padding: 12px 20px;
        }

        .filter-row {
          display: flex;
          align-items: center;
          gap: 15px;
          flex-wrap: wrap;
          max-width: 1200px;
          margin: 0 auto;
        }

        .filter-dropdown {
          position: relative;
        }

        .dropdown-toggle {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 8px 12px;
          background: white;
          border: 1px solid #ced4da;
          border-radius: 3px;
          cursor: pointer;
          font-size: 14px;
          color: #6c757d;
          transition: all 0.2s;
        }

        .dropdown-toggle:hover {
          background: #f8f9fa;
        }

        .dropdown-toggle.has-active {
          background: #e11921;
          color: white;
          border-color: #e11921;
        }

        .dropdown-menu {
          position: absolute;
          top: calc(100% + 5px);
          left: 0;
          background: white;
          border: 1px solid #dee2e6;
          border-radius: 4px;
          box-shadow: 0 6px 12px rgba(0,0,0,0.175);
          min-width: 280px;
          max-width: 350px;
          z-index: 1050;
          display: flex;
          flex-direction: column;
        }

        .dropdown-search {
          padding: 10px 15px;
          border-bottom: 1px solid #dee2e6;
        }

        .dropdown-search input {
          width: 100%;
          padding: 6px 10px 6px 32px;
          border: 1px solid #ced4da;
          border-radius: 3px;
          font-size: 14px;
          font-family: acumin-pro-wide, sans-serif;
        }

        .dropdown-search-wrapper {
          position: relative;
        }

        .dropdown-search-icon {
          position: absolute;
          left: 10px;
          top: 50%;
          transform: translateY(-50%);
          color: #6b7280;
        }

        .dropdown-options-wrapper {
          max-height: 400px;
          overflow-y: auto;
        }

        .dropdown-footer {
          padding: 10px 15px;
          border-top: 1px solid #dee2e6;
          display: flex;
          justify-content: space-between;
          gap: 10px;
        }

        .dropdown-footer button {
          padding: 6px 12px;
          border-radius: 3px;
          font-size: 14px;
          cursor: pointer;
          font-family: acumin-pro-wide, sans-serif;
          font-weight: 400;
          transition: all 0.2s;
        }

        .clear-btn {
          background: white;
          border: 1px solid #ced4da;
          color: #495057;
        }

        .clear-btn:hover {
          background: #f8f9fa;
        }

        .done-btn {
          background: #e11921;
          border: 1px solid #e11921;
          color: white;
        }

        .done-btn:hover {
          background: #c41519;
        }

        .clear-all-btn {
          padding: 6px 12px;
          background: #e11921;
          border: 1px solid #e11921;
          color: white;
          border-radius: 3px;
          font-size: 14px;
          cursor: pointer;
          font-family: acumin-pro-wide, sans-serif;
          font-weight: 400;
          transition: all 0.2s;
        }

        .clear-all-btn:hover {
          background: #c41519;
        }

        .dropdown-header {
          padding: 10px 15px;
          background: #f8f9fa;
          border-bottom: 1px solid #dee2e6;
          font-weight: 600;
          color: #495057;
          font-size: 14px;
        }

        .dropdown-content {
          padding: 8px 0;
        }

        .option-item {
          padding: 8px 15px;
          display: flex;
          align-items: center;
          cursor: pointer;
          transition: background-color 0.2s;
          font-size: 14px;
        }

        .option-item:hover {
          background-color: #f8f9fa;
        }

        .toggle-switch {
          width: 40px;
          height: 20px;
          background-color: #ccc;
          border-radius: 10px;
          position: relative;
          transition: background-color 0.3s;
          margin-right: 10px;
          flex-shrink: 0;
        }

        .toggle-switch.active {
          background-color: #e11921;
        }

        .toggle-switch::after {
          content: '';
          position: absolute;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background-color: white;
          top: 2px;
          left: 2px;
          transition: transform 0.3s;
        }

        .toggle-switch.active::after {
          transform: translateX(20px);
        }

        .option-text {
          flex: 1;
          color: #495057;
        }

        .option-count {
          color: #6c757d;
          font-size: 12px;
        }

        .main-search-container {
          padding: 20px;
          background: #f8f9fa;
        }

        .main-search-wrapper {
          max-width: 1200px;
          margin: 0 auto;
          position: relative;
        }

        .main-search-input {
          width: 100%;
          padding: 12px 40px 12px 45px;
          border: 1px solid #ced4da;
          border-radius: 3px;
          font-size: 16px;
        }

        .main-search-icon {
          position: absolute;
          left: 15px;
          top: 50%;
          transform: translateY(-50%);
          color: #6c757d;
        }

        .filter-pills {
          padding: 15px 20px;
          background: white;
          border-bottom: 1px solid #e5e5e5;
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .filter-pill-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .filter-label {
          font-size: 14px;
          color: #495057;
          font-weight: 500;
        }

        .filter-value {
          background: white;
          color: #495057;
          padding: 4px 10px;
          border: 1px solid #e5e7eb;
          border-radius: 3px;
          font-size: 13px;
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }

        .filter-remove {
          background: none;
          border: none;
          color: #e11921;
          cursor: pointer;
          padding: 0;
          display: flex;
          align-items: center;
        }


        .swiper-button-prev,
        .swiper-button-next {
          position: absolute !important;
          top: 0 !important;
          bottom: 18px !important;
          width: 60px !important;
          height: calc(100% - 18px) !important;
          margin-top: 0 !important;
          z-index: 10 !important;
          cursor: pointer !important;
          color: white !important;
        }

        .swiper-button-prev,
        .swiper-button-next {
          position: absolute !important;
          top: 50% !important;
          transform: translateY(-50%) !important;
          width: 96px !important;
          height: min(50px, 40%) !important;
          z-index: 10 !important;
          cursor: pointer !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        }

        .swiper-button-prev {
          left: 0 !important;
          right: auto !important;
          background: linear-gradient(90deg, rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0)) !important;
        }

        .swiper-button-next {
          right: 0 !important;
          left: auto !important;
          background: linear-gradient(270deg, rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0)) !important;
        }

        .swiper-button-prev:hover {
          background: linear-gradient(90deg, rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0)) !important;
        }

        .swiper-button-next:hover {
          background: linear-gradient(270deg, rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0)) !important;
        }

        .swiper-button-prev:after,
        .swiper-button-next:after {
          font-family: swiper-icons !important;
          font-size: 20.8px !important;
          font-weight: 400 !important;
          line-height: 20.8px !important;
          margin-left: -3.2px !important;
          -webkit-font-smoothing: antialiased !important;
          display: block !important;
          color: rgb(255, 255, 255) !important;
        }

        .swiper-scrollbar {
          position: absolute !important;
          background: rgb(222, 226, 230) !important;
          border-radius: 10px !important;
          bottom: 4px !important;
          height: 8px !important;
          left: 1% !important;
          width: 98% !important;
          z-index: 50 !important;
        }

        .swiper-scrollbar-drag {
          background: rgb(225, 25, 33) !important;
          border-radius: 10px !important;
          height: 8px !important;
          width: 6.15625px !important;
          cursor: grab !important;
          position: relative !important;
        }

        .swiper-scrollbar-drag:active {
          cursor: grabbing !important;
        }

        .swiper-container-wrapper {
          position: relative;
          width: 100%;
        }

        .il-search-result {
          background: white;
          overflow: visible;
        }

        .property-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
          padding: 20px;
          max-width: 1425px;
          margin: 0 auto;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #f3f4f6;
          border-top: 3px solid #e11921;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .no-results {
          grid-column: 1 / -1;
          text-align: center;
          padding: 4rem 2rem;
          color: #6b7280;
        }

        .no-results-title {
          font-size: 1.25rem;
          margin-bottom: 0.5rem;
          font-family: acumin-pro-wide, sans-serif;
          font-weight: 400;
        }

        .no-results-text {
          font-size: 0.875rem;
          font-family: acumin-pro-wide, sans-serif;
          font-weight: 300;
        }

        .loading-container {
          grid-column: 1 / -1;
          display: flex;
          justify-content: center;
          padding: 2rem 0;
        }

        .end-message {
          grid-column: 1 / -1;
          text-align: center;
          padding: 2rem 0;
          color: #6b7280;
          font-size: 14px;
          font-weight: 300;
          font-family: acumin-pro-wide, sans-serif;
        }

        .results-count {
          padding: 15px 20px;
          background: white;
          border-bottom: 1px solid #e5e5e5;
          max-width: 1200px;
          margin: 0 auto;
        }

        .results-count p {
          color: #6b7280;
          font-size: 14px;
          font-weight: 300;
          font-family: acumin-pro-wide, sans-serif;
          margin: 0;
        }
      `}</style>

      <div className="search-page">
        <div className="filter-bar" ref={dropdownRef}>
          <div className="filter-row">
            {Object.entries(filterCategories).map(([key, category]) => {
              const hasActive = activeFilters.find(f => f.category === category.name)?.values.length || 0;
              const filteredOptions = getFilteredOptions(key, category.options);

              return (
                <div key={key} className="filter-dropdown">
                  <button
                    className={`dropdown-toggle ${hasActive > 0 ? 'has-active' : ''}`}
                    onClick={() => setOpenDropdown(openDropdown === key ? null : key)}
                  >
                    <span>{category.name}</span>
                    <ChevronDown size={16} />
                  </button>

                  {openDropdown === key && (
                    <div className="dropdown-menu">
                      <div className="dropdown-header">{category.name}</div>

                      {category.hasSearch && (
                        <div className="dropdown-search">
                          <div className="dropdown-search-wrapper">
                            <Search className="dropdown-search-icon" size={16} />
                            <input
                              type="text"
                              placeholder="Search..."
                              value={searchTerms[key] || ''}
                              onChange={(e) => setSearchTerms(prev => ({ ...prev, [key]: e.target.value }))}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>
                      )}

                      <div className="dropdown-options-wrapper">
                        <div className="dropdown-content">
                          {filteredOptions.map((option, idx) => (
                            <div
                              key={idx}
                              className="option-item"
                              onClick={() => toggleFilter(category.name, option)}
                            >
                              <div className={`toggle-switch ${isFilterActive(category.name, option) ? 'active' : ''}`} />
                              <span className="option-text">{option}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="dropdown-footer">
                        <button className="clear-btn" onClick={(e) => { e.stopPropagation(); clearCategoryFilters(category.name); }}>
                          Clear
                        </button>
                        <button className="done-btn" onClick={(e) => { e.stopPropagation(); setOpenDropdown(null); }}>
                          Done
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="main-search-container">
          <div className="main-search-wrapper">
            <Search className="main-search-icon" size={20} />
            <input
              type="text"
              className="main-search-input"
              placeholder="Search locations..."
              defaultValue={searchParams.get('q') || ''}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  const value = e.currentTarget.value;
                  router.push(value ? `/search?q=${encodeURIComponent(value)}` : '/search');
                }
              }}
            />
          </div>
        </div>

        {activeFilters.length > 0 && (
          <div className="filter-pills">
            {activeFilters.map(filter => (
              <div key={filter.category} className="filter-pill-group">
                <span className="filter-label">{filter.category}:</span>
                {filter.values.map(value => (
                  <span key={value} className="filter-value">
                    {value}
                    <button
                      className="filter-remove"
                      onClick={() => removeFilterValue(filter.category, value)}
                    >
                      <X size={14} strokeWidth={2} />
                    </button>
                  </span>
                ))}
              </div>
            ))}
            <button className="clear-all-btn" onClick={clearAllFilters}>
              Clear All Filters
            </button>
          </div>
        )}

        <div className="results-count">
          <p>
            Showing {properties.length} {properties.length === 1 ? 'property' : 'properties'}
            {!hasMore && properties.length > 0 && ' (all results loaded)'}
          </p>
        </div>

        <div className="property-grid">
          {properties.map(property => (
            <PropertyCard key={property.id} property={property} />
          ))}

          {loading && (
            <div className="loading-container">
              <div className="loading-spinner" />
            </div>
          )}

          {!loading && properties.length === 0 && (
            <div className="no-results">
              <p className="no-results-title">No properties found</p>
              <p className="no-results-text">Try adjusting your filters</p>
            </div>
          )}

          {!hasMore && properties.length > 0 && (
            <div className="end-message">
              No more properties to load
            </div>
          )}
        </div>
      </div>
    </>
  );
}
