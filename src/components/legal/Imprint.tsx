import React from 'react';
import { Mail, Phone, MapPin } from 'lucide-react';

const Imprint = () => {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-8">Impressum</h1>
      
      <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 space-y-8">
        <section>
          <h2 className="text-2xl font-semibold mb-4">Angaben gemäß § 5 TMG</h2>
          <div className="space-y-2 text-gray-300">
            <p>Dogmania GmbH</p>
            <p>Musterstraße 123</p>
            <p>12345 Berlin</p>
            <p>Deutschland</p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Kontakt</h2>
          <div className="space-y-4">
            <div className="flex items-center text-gray-300">
              <Phone className="mr-3 text-purple-400" size={20} />
              <span>+49 (0) 123 456789</span>
            </div>
            <div className="flex items-center text-gray-300">
              <Mail className="mr-3 text-purple-400" size={20} />
              <span>info@dogmania.de</span>
            </div>
            <div className="flex items-center text-gray-300">
              <MapPin className="mr-3 text-purple-400" size={20} />
              <span>Musterstraße 123, 12345 Berlin</span>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Handelsregister</h2>
          <div className="space-y-2 text-gray-300">
            <p>Registergericht: Amtsgericht Berlin-Charlottenburg</p>
            <p>Registernummer: HRB 123456</p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Umsatzsteuer-ID</h2>
          <div className="space-y-2 text-gray-300">
            <p>Umsatzsteuer-Identifikationsnummer gemäß §27 a Umsatzsteuergesetz:</p>
            <p>DE 123 456 789</p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Geschäftsführung</h2>
          <div className="space-y-2 text-gray-300">
            <p>Max Mustermann (CEO)</p>
            <p>Maria Musterfrau (COO)</p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h2>
          <div className="space-y-2 text-gray-300">
            <p>Max Mustermann</p>
            <p>Dogmania GmbH</p>
            <p>Musterstraße 123</p>
            <p>12345 Berlin</p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Streitschlichtung</h2>
          <p className="text-gray-300">
            Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit: 
            <a href="https://ec.europa.eu/consumers/odr" className="text-purple-400 hover:text-purple-300 ml-1">
              https://ec.europa.eu/consumers/odr
            </a>
          </p>
        </section>
      </div>
    </div>
  );
};

export default Imprint;