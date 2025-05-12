import React from 'react';
import { BookOpen, Users, Award, Hourglass } from 'lucide-react';
import { motion } from 'framer-motion';

interface BenefitCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  index: number;
}

const BenefitCard: React.FC<BenefitCardProps> = ({ icon, title, description, index }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.7, delay: index * 0.1 }}
      className="bg-blue-900/30 backdrop-blur-sm p-8 rounded-2xl shadow-xl"
    >
      <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-3 rounded-xl inline-block mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-3">{title}</h3>
      <p className="text-gray-300">{description}</p>
    </motion.div>
  );
};

const BenefitsSection = () => {
  const benefits = [
    {
      icon: <BookOpen size={24} className="text-white" />,
      title: "Expertenwissen",
      description: "Zugang zu über 100+ Kursen von Hundetrainern und Tierärzten."
    },
    {
      icon: <Users size={24} className="text-white" />,
      title: "Starke Community",
      description: "Tausche dich mit Gleichgesinnten aus und lerne von ihren Erfahrungen."
    },
    {
      icon: <Award size={24} className="text-white" />,
      title: "Zertifizierte Trainer",
      description: "Alle Kurse werden von anerkannten Experten entwickelt und betreut."
    },
    {
      icon: <Hourglass size={24} className="text-white" />,
      title: "Flexibles Lernen",
      description: "Lerne in deinem eigenen Tempo, wann und wo es dir passt."
    }
  ];

  return (
    <section className="py-20 px-6">
      <div className="container mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Warum Dogmania?</h2>
          <p className="text-gray-300 text-lg">Unsere Plattform bietet alles, was du und dein Hund für ein harmonisches Zusammenleben brauchen.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((benefit, index) => (
            <BenefitCard
              key={index}
              icon={benefit.icon}
              title={benefit.title}
              description={benefit.description}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;