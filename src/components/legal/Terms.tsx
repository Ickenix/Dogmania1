import React from 'react';

const Terms = () => {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-8">Allgemeine Geschäftsbedingungen</h1>
      
      <div className="prose prose-invert max-w-none space-y-8">
        <section>
          <h2 className="text-2xl font-semibold mb-4">§1 Geltungsbereich</h2>
          <p className="text-gray-300">
            Diese Allgemeinen Geschäftsbedingungen gelten für alle gegenwärtigen und zukünftigen Geschäftsbeziehungen zwischen der Dogmania GmbH (nachfolgend "Anbieter") und dem Kunden (nachfolgend "Nutzer").
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">§2 Vertragsgegenstand</h2>
          <p className="text-gray-300">
            Der Anbieter betreibt eine Online-Plattform für Hundetraining und Community-Austausch. Die Plattform bietet verschiedene Dienste an, einschließlich aber nicht beschränkt auf:
          </p>
          <ul className="list-disc pl-6 text-gray-300 mt-4">
            <li>Online-Kurse und Trainingsvideos</li>
            <li>Community-Funktionen und Foren</li>
            <li>Marktplatz für Hundeprodukte</li>
            <li>Vermittlung von Hundetrainern</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">§3 Registrierung und Nutzerkonto</h2>
          <p className="text-gray-300">
            Die Nutzung bestimmter Dienste erfordert eine Registrierung. Der Nutzer ist verpflichtet, die bei der Registrierung abgefragten Daten wahrheitsgemäß und vollständig anzugeben.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">§4 Preise und Zahlungsbedingungen</h2>
          <p className="text-gray-300">
            Die Nutzung der Grundfunktionen ist kostenlos. Premium-Funktionen sind kostenpflichtig. Die aktuellen Preise sind auf der Website einsehbar. Alle Preise verstehen sich inklusive der gesetzlichen Mehrwertsteuer.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">§5 Widerrufsrecht</h2>
          <p className="text-gray-300">
            Verbrauchern steht ein gesetzliches Widerrufsrecht zu. Die Einzelheiten ergeben sich aus der Widerrufsbelehrung, die dem Nutzer im Rahmen des Bestellvorgangs zur Verfügung gestellt wird.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">§6 Haftung</h2>
          <p className="text-gray-300">
            Der Anbieter haftet unbeschränkt für Vorsatz und grobe Fahrlässigkeit. Für leichte Fahrlässigkeit haftet der Anbieter nur bei Verletzung einer wesentlichen Vertragspflicht und nur in Höhe des vorhersehbaren Schadens.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">§7 Urheberrecht</h2>
          <p className="text-gray-300">
            Alle Inhalte der Plattform sind urheberrechtlich geschützt. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechts bedürfen der schriftlichen Zustimmung des Anbieters.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">§8 Datenschutz</h2>
          <p className="text-gray-300">
            Die Erhebung, Verarbeitung und Nutzung personenbezogener Daten erfolgt ausschließlich nach den Bestimmungen der Datenschutzerklärung und unter Beachtung der geltenden datenschutzrechtlichen Bestimmungen.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">§9 Schlussbestimmungen</h2>
          <p className="text-gray-300">
            Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts. Erfüllungsort und ausschließlicher Gerichtsstand ist Berlin, soweit gesetzlich zulässig.
          </p>
        </section>
      </div>
    </div>
  );
};

export default Terms;