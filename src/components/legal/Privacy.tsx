import React from 'react';

const Privacy = () => {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-8">Datenschutzerklärung</h1>
      
      <div className="prose prose-invert max-w-none space-y-8">
        <section>
          <h2 className="text-2xl font-semibold mb-4">1. Datenschutz auf einen Blick</h2>
          
          <h3 className="text-xl font-semibold mb-3">Allgemeine Hinweise</h3>
          <p className="text-gray-300">
            Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen Daten passiert, wenn Sie diese Website besuchen. Personenbezogene Daten sind alle Daten, mit denen Sie persönlich identifiziert werden können.
          </p>

          <h3 className="text-xl font-semibold mt-6 mb-3">Datenerfassung auf dieser Website</h3>
          <p className="text-gray-300">
            Die Datenverarbeitung auf dieser Website erfolgt durch den Websitebetreiber. Dessen Kontaktdaten können Sie dem Impressum dieser Website entnehmen.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">2. Hosting und Content Delivery Networks (CDN)</h2>
          <p className="text-gray-300">
            Diese Website wird bei einem externen Dienstleister gehostet (Hoster). Die personenbezogenen Daten, die auf dieser Website erfasst werden, werden auf den Servern des Hosters gespeichert.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">3. Allgemeine Hinweise und Pflichtinformationen</h2>
          
          <h3 className="text-xl font-semibold mb-3">Datenschutz</h3>
          <p className="text-gray-300">
            Die Betreiber dieser Seiten nehmen den Schutz Ihrer persönlichen Daten sehr ernst. Wir behandeln Ihre personenbezogenen Daten vertraulich und entsprechend der gesetzlichen Datenschutzvorschriften sowie dieser Datenschutzerklärung.
          </p>

          <h3 className="text-xl font-semibold mt-6 mb-3">Hinweis zur verantwortlichen Stelle</h3>
          <p className="text-gray-300">
            Die verantwortliche Stelle für die Datenverarbeitung auf dieser Website ist:<br /><br />
            Dogmania GmbH<br />
            Musterstraße 123<br />
            12345 Berlin<br />
            Deutschland<br /><br />
            Telefon: +49 (0) 123 456789<br />
            E-Mail: info@dogmania.de
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">4. Datenerfassung auf dieser Website</h2>
          
          <h3 className="text-xl font-semibold mb-3">Cookies</h3>
          <p className="text-gray-300">
            Unsere Website verwendet Cookies. Das sind kleine Textdateien, die Ihr Webbrowser auf Ihrem Endgerät speichert. Cookies helfen uns dabei, unser Angebot nutzerfreundlicher, effektiver und sicherer zu machen.
          </p>

          <h3 className="text-xl font-semibold mt-6 mb-3">Server-Log-Dateien</h3>
          <p className="text-gray-300">
            Der Provider der Seiten erhebt und speichert automatisch Informationen in so genannten Server-Log-Dateien, die Ihr Browser automatisch an uns übermittelt.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">5. Analyse-Tools und Werbung</h2>
          <p className="text-gray-300">
            Wir nutzen verschiedene Analyse-Tools, um die Nutzung unserer Website auszuwerten. Die daraus gewonnenen Daten werden genutzt, um unsere Website zu optimieren.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">6. Newsletter</h2>
          <p className="text-gray-300">
            Wenn Sie den auf der Website angebotenen Newsletter beziehen möchten, benötigen wir von Ihnen eine E-Mail-Adresse sowie Informationen, welche uns die Überprüfung gestatten, dass Sie der Inhaber der angegebenen E-Mail-Adresse sind und mit dem Empfang des Newsletters einverstanden sind.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">7. Plugins und Tools</h2>
          <p className="text-gray-300">
            Auf unserer Website setzen wir verschiedene Plugins und Tools ein. Dazu gehören beispielsweise Google Maps, YouTube-Videos oder Social Media Plugins.
          </p>
        </section>
      </div>
    </div>
  );
};

export default Privacy;