import { Card, CardContent } from '../ui';

interface MenuItem {
  day: string;
  name: string;
  description: string;
}

interface WeekendMenuCardProps {
  menuItems?: MenuItem[];
}

export function WeekendMenuCard({ menuItems = [] }: WeekendMenuCardProps) {
  const defaultMenuItems: MenuItem[] = [
    { 
      day: "Thursday", 
      name: "Pulled Pork Shoulder", 
      description: "Minooka-raised pork with Chef Bivens' \"I'm Double Baked\" potatoes"
    },
    { 
      day: "Friday", 
      name: "Sausage & Peppers", 
      description: "Chicago classic - pairs best with a shot of Fireball"
    },
    { 
      day: "Saturday", 
      name: "Not Your Mama's Meatball Sandwich", 
      description: "Handheld marvel with your choice of chips (BYOC)"
    }
  ];

  const displayItems = menuItems.length > 0 ? menuItems : defaultMenuItems;

  return (
    <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-medium text-orange-600 mb-1">
              Golf Trip Menu
            </h3>
          </div>
          <div className="text-orange-400 text-2xl">🍽️</div>
        </div>
        
        <div className="space-y-4">
          {displayItems.map((item, index) => (
            <div key={index} className="border-b border-orange-200 pb-3 last:border-b-0 last:pb-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-orange-600 bg-orange-100 px-2 py-1 rounded">
                  {item.day}
                </span>
              </div>
              <p className="text-sm font-medium text-orange-900 mb-1">{item.name}</p>
              <p className="text-xs text-orange-700 leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}