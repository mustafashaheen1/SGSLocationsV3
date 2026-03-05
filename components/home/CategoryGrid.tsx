import Link from 'next/link';
import Image from 'next/image';

interface Category {
  id: string;
  name: string;
  slug: string;
  image: string;
  count: number;
}

interface CategoryGridProps {
  categories: Category[];
}

export function CategoryGrid({ categories }: CategoryGridProps) {
  if (categories.length === 0) return null;

  return (
    <section className="py-24 bg-[#f8f9fa]">
      <div className="mx-auto px-4" style={{maxWidth: '1345px'}}>
        <h2 className="text-4xl text-center mb-16" style={{fontWeight: 100, color: '#212529'}}>
          Browse by Category
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category, index) => (
            <Link
              key={category.id}
              href={`/search?subcategory=${category.id}`}
              className="group relative h-48 rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all"
            >
              <Image
                src={category.image}
                alt={category.name}
                fill
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                priority={index < 4}
                quality={75}
                placeholder="empty"
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/20" />
              <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                <h3 className="text-lg mb-1" style={{fontWeight: 400}}>{category.name}</h3>
                <p className="text-sm opacity-90" style={{fontWeight: 300}}>
                  {category.count} {category.count === 1 ? 'Location' : 'Locations'}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
