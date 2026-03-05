import { MapPin, FileCheck, Image as ImageIcon } from 'lucide-react';

interface Service {
  id: string;
  icon: string;
  title: string;
  description: string;
  display_order: number;
}

interface ServicesSectionProps {
  services: Service[];
}

const iconMap: { [key: string]: any } = {
  'MapPin': MapPin,
  'FileCheck': FileCheck,
  'ImageIcon': ImageIcon,
};

export function ServicesSection({ services }: ServicesSectionProps) {
  if (services.length === 0) return null;

  return (
    <section className="py-24 bg-[#1a3a5a] text-white">
      <div className="mx-auto px-4" style={{maxWidth: '1345px'}}>
        <h2 className="text-4xl text-center mb-16" style={{fontWeight: 100}}>Our Services</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {services.map((service) => {
            const Icon = iconMap[service.icon] || MapPin;
            return (
              <div key={service.id} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-brand rounded-full mb-6">
                  <Icon className="w-8 h-8" />
                </div>
                <h3 className="text-2xl mb-4" style={{fontWeight: 300}}>{service.title}</h3>
                <p className="text-gray-300 leading-relaxed" style={{fontWeight: 300}}>{service.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
