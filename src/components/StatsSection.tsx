import React from 'react';
import { motion, useInView } from 'framer-motion';

interface CounterProps {
  end: number;
  duration: number;
  suffix?: string;
  delay?: number;
}

const Counter: React.FC<CounterProps> = ({ end, duration, suffix = '', delay = 0 }) => {
  const [count, setCount] = React.useState(0);
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  React.useEffect(() => {
    if (!isInView) return;

    let startTime: number;
    let requestId: number;

    const countUp = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * end));

      if (progress < 1) {
        requestId = requestAnimationFrame(countUp);
      }
    };

    const timeoutId = setTimeout(() => {
      requestId = requestAnimationFrame(countUp);
    }, delay);

    return () => {
      clearTimeout(timeoutId);
      cancelAnimationFrame(requestId);
    };
  }, [end, duration, isInView, delay]);

  return <span ref={ref}>{count}{suffix}</span>;
};

const StatsSection = () => {
  return (
    <section className="py-24 px-6">
      <div className="container mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="max-w-5xl mx-auto bg-gradient-to-br from-blue-900/40 to-purple-900/40 backdrop-blur-sm rounded-3xl p-8 md:p-12 shadow-xl"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Unsere wachsende Community</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="p-4"
            >
              <p className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 text-purple-300">
                <Counter end={4000} duration={2000} suffix="+" delay={0} />
              </p>
              <p className="text-gray-300">Aktive Mitglieder</p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="p-4"
            >
              <p className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 text-purple-300">
                <Counter end={120} duration={2000} suffix="+" delay={300} />
              </p>
              <p className="text-gray-300">Kurse & Tutorials</p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="p-4"
            >
              <p className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 text-purple-300">
                <Counter end={35} duration={2000} suffix="+" delay={600} />
              </p>
              <p className="text-gray-300">Experten & Trainer</p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="p-4"
            >
              <p className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 text-purple-300">
                <Counter end={98} duration={2000} suffix="%" delay={900} />
              </p>
              <p className="text-gray-300">Zufriedene Nutzer</p>
            </motion.div>
          </div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="text-center mt-12"
          >
            <a 
              href="#" 
              className="inline-block bg-white text-purple-900 font-semibold px-8 py-4 rounded-full text-lg shadow-lg hover:shadow-white/30 hover:scale-105 transition-all duration-300"
            >
              Teil der Community werden
            </a>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default StatsSection;