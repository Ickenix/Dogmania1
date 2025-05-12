import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import DogVaccinations from './DogVaccinations';
import DogWeightHistory from './DogWeightHistory';
import DogMedications from './DogMedications';
import DogHealthRecords from './DogHealthRecords';

interface DogHealthProps {
  dogId: string;
  dogName: string;
}

const DogHealth: React.FC<DogHealthProps> = ({ dogId, dogName }) => {
  const [activeTab, setActiveTab] = useState('vaccinations');

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold mb-4">Gesundheitsdaten für {dogName}</h2>
      
      <Tabs defaultValue="vaccinations" onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 mb-6 bg-white/5 backdrop-blur-lg rounded-lg p-1">
          <TabsTrigger value="vaccinations" className="data-[state=active]:bg-purple-600">
            Impfungen
          </TabsTrigger>
          <TabsTrigger value="medications" className="data-[state=active]:bg-purple-600">
            Medikamente
          </TabsTrigger>
          <TabsTrigger value="records" className="data-[state=active]:bg-purple-600">
            Gesundheitsakte
          </TabsTrigger>
          <TabsTrigger value="weight" className="data-[state=active]:bg-purple-600">
            Gewichtsverlauf
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="vaccinations">
          <DogVaccinations dogId={dogId} dogName={dogName} />
        </TabsContent>
        
        <TabsContent value="medications">
          <DogMedications dogId={dogId} dogName={dogName} />
        </TabsContent>
        
        <TabsContent value="records">
          <DogHealthRecords dogId={dogId} dogName={dogName} />
        </TabsContent>
        
        <TabsContent value="weight">
          <DogWeightHistory dogId={dogId} dogName={dogName} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DogHealth;