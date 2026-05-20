import { Metadata } from 'next';
import LegalPageLayout from '@/components/legal/LegalPageLayout';

export const metadata: Metadata = {
  title: 'Privacy Policy | HispanUSA Accounting & Tax Services',
  description:
    'Privacy policy for HispanUSA Accounting & Tax Services, including information about SMS communications, data handling, and your privacy rights.',
};

function EnglishContent() {
  return (
    <>
      <h1 className="text-3xl font-bold text-[#03296A] mb-2">PRIVACY POLICY</h1>
      <p className="text-sm text-gray-500 mb-8">
        Effective Date: May 20, 2026 &middot; Last Updated: May 20, 2026
      </p>

      <p className="mb-4">
        This Privacy Policy describes how HISPANUSA LLC, doing business as HispanUSA Accounting &amp;
        Tax Services (&quot;HispanUSA,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;),
        collects, uses, stores, and protects information about our clients and website visitors. This
        policy applies to information we collect through our website at hispanusa.com, our client
        booking portal at book.hispanusa.com, telephone and SMS communications, email, fax, and
        in-person interactions at our office.
      </p>

      <p className="mb-4">If you have questions about this policy, contact us at:</p>
      <address className="not-italic mb-8 text-gray-700">
        <strong>HISPANUSA LLC</strong>
        <br />
        8050 North University Drive, Suite #206
        <br />
        Tamarac, FL 33321
        <br />
        Phone: 954-934-0194
        <br />
        Email: info@hispanusa.com
      </address>

      {/* Section 1 */}
      <h2 className="text-xl font-bold text-[#03296A] mt-8 mb-3">1. INFORMATION WE COLLECT</h2>
      <p className="mb-4">
        We collect information you provide to us directly. This includes:
      </p>
      <ul className="list-disc pl-6 space-y-2 my-4">
        <li>
          <strong>Contact information</strong> such as your full name, mailing address, phone number,
          and email address.
        </li>
        <li>
          <strong>Tax preparation information</strong> including Social Security numbers, dates of
          birth, dependent information, income documents (W-2s, 1099s, K-1s), business income and
          expense records, bank account information for direct deposit, and any other documents
          necessary to prepare your federal, state, or local tax returns.
        </li>
        <li>
          <strong>Accounting and bookkeeping information</strong> including bank statements, receipts,
          invoices, payroll records, and other financial documents you provide for accounting services.
        </li>
        <li>
          <strong>Professional services information</strong> including documents and information
          related to immigration consulting, divorce, bankruptcy, offer in compromise, and other
          professional services we provide.
        </li>
        <li>
          <strong>Communications</strong> including text messages, voicemails, emails, fax
          transmissions, and notes from telephone calls or in-person meetings.
        </li>
        <li>
          <strong>Appointment information</strong> including the date, time, and type of appointment
          you schedule, and any notes you provide about the purpose of your visit.
        </li>
      </ul>
      <p className="mb-4">
        We also automatically collect limited information when you visit our website, including your IP
        address, browser type, pages viewed, and the date and time of your visit. This information is
        collected by standard web hosting and analytics tools.
      </p>

      {/* Section 2 */}
      <h2 className="text-xl font-bold text-[#03296A] mt-8 mb-3">2. HOW WE USE YOUR INFORMATION</h2>
      <p className="mb-4">We use the information we collect to:</p>
      <ul className="list-disc pl-6 space-y-2 my-4">
        <li>
          Prepare and file your tax returns with federal, state, and local taxing authorities.
        </li>
        <li>
          Provide accounting, bookkeeping, and professional services you have engaged us to perform.
        </li>
        <li>
          Communicate with you about your appointments, the status of your tax return, documents we
          need from you, and other matters related to the services we provide.
        </li>
        <li>
          Send you appointment reminders and updates by SMS text message and email (see Section 5 for
          details about SMS communications).
        </li>
        <li>
          Comply with our legal obligations under federal and state tax law, including record-retention
          requirements imposed by the Internal Revenue Service.
        </li>
        <li>
          Protect against fraud, identity theft, and unauthorized access to your information.
        </li>
      </ul>

      {/* Section 3 */}
      <h2 className="text-xl font-bold text-[#03296A] mt-8 mb-3">
        3. HOW WE SHARE YOUR INFORMATION
      </h2>
      <p className="mb-4">
        We do not sell your personal information. We share information only as necessary to provide our
        services or as required by law. Specifically:
      </p>
      <ul className="list-disc pl-6 space-y-2 my-4">
        <li>
          We disclose information to the Internal Revenue Service, state tax authorities, and local
          taxing authorities as required to prepare and file your tax returns.
        </li>
        <li>
          We disclose information to third parties only with your specific written consent, such as
          when you authorize us to share your tax return with a lender, mortgage broker, attorney, or
          other professional.
        </li>
        <li>
          We use third-party software providers to operate our practice, including tax preparation
          software, accounting software, document management systems, telephone and SMS services, and
          email services. These providers process information on our behalf and are contractually
          limited to using your information only to provide services to us.
        </li>
        <li>
          We may disclose information when required by subpoena, court order, or other legal process.
        </li>
        <li>
          In the event of a sale, merger, or transfer of our business, client information may be
          transferred to the acquiring entity, subject to the same protections described in this
          policy.
        </li>
      </ul>
      <p className="mb-4">
        <strong>Information You Provide About SMS Opt-In:</strong> Mobile phone numbers and SMS opt-in
        consent are <strong>NEVER</strong> shared with third parties or affiliates for marketing
        purposes. SMS opt-in information is used only to send you the messages described in Section 5.
      </p>

      {/* Section 4 */}
      <h2 className="text-xl font-bold text-[#03296A] mt-8 mb-3">
        4. INFORMATION SECURITY AND STORAGE
      </h2>
      <p className="mb-4">
        We store client documents and information on internal office systems located at our office at
        8050 North University Drive, Suite #206, Tamarac, FL 33321. Access to client information is
        limited to authorized HispanUSA staff using office computers. We maintain on-premises backups
        of client information. We are in the process of implementing additional cloud-based backup
        capabilities.
      </p>
      <p className="mb-4">
        We use third-party software services (including tax preparation, accounting, and communication
        tools) that store certain information on the providers&apos; secure servers. Each of these
        providers maintains its own security practices and is required to handle your information in
        accordance with applicable law.
      </p>
      <p className="mb-4">
        No method of electronic storage or transmission is one hundred percent secure. While we take
        reasonable steps to protect your information, we cannot guarantee absolute security.
      </p>

      {/* Section 5 */}
      <h2 className="text-xl font-bold text-[#03296A] mt-8 mb-3">
        5. SMS / TEXT MESSAGE COMMUNICATIONS
      </h2>
      <p className="mb-4">
        If you provide your mobile phone number and opt in to SMS communications, we will send you
        text messages related to the services we provide.
      </p>
      <p className="mb-2 font-semibold">Types of messages we send:</p>
      <ul className="list-disc pl-6 space-y-2 my-4">
        <li>Appointment confirmations after you book an appointment with us.</li>
        <li>Appointment reminders before your scheduled appointment.</li>
        <li>Document checklist messages telling you what to bring or send for your appointment.</li>
        <li>Status updates about your tax return or other services.</li>
        <li>Responses to questions you send us by text.</li>
      </ul>
      <p className="mb-4">
        <strong>Message frequency:</strong> You can expect to receive approximately 1 to 5 messages
        per appointment cycle. Message frequency varies based on the services you have engaged us to
        provide.
      </p>
      <p className="mb-4">
        <strong>Message and data rates:</strong> Standard message and data rates may apply based on
        your mobile carrier and plan. HispanUSA does not charge for SMS messages, but your carrier
        may.
      </p>
      <p className="mb-4">
        <strong>How to opt out:</strong> You can opt out of SMS messages at any time by replying{' '}
        <strong>STOP</strong> to any text message you receive from us. After you reply STOP, you will
        receive a confirmation message and will not receive further SMS messages from us. You will
        continue to receive non-SMS communications (email, phone, mail) about your services unless you
        also opt out of those channels.
      </p>
      <p className="mb-4">
        <strong>How to get help:</strong> Reply <strong>HELP</strong> to any text message to receive
        contact information. You can also call our office at 954-934-0194 or email
        info@hispanusa.com.
      </p>
      <p className="mb-4">
        <strong>SMS information is not shared:</strong> Your mobile phone number and the fact that you
        have opted in to SMS communications are never shared with third parties or affiliates for
        marketing purposes.
      </p>
      <p className="mb-4">
        <strong>Supported carriers:</strong> SMS messages are supported on all major U.S. wireless
        carriers. Carriers are not liable for delayed or undelivered messages.
      </p>

      {/* Section 6 */}
      <h2 className="text-xl font-bold text-[#03296A] mt-8 mb-3">
        6. EMAIL AND OTHER COMMUNICATIONS
      </h2>
      <p className="mb-4">
        We send transactional emails about your appointments, tax returns, and account from addresses
        including appointments@hispanusa.com, taxes@hispanusa.com, accounting@hispanusa.com, and
        info@hispanusa.com. We do not send unsolicited marketing emails. If we ever send a newsletter
        or promotional message, every such message will include an unsubscribe link.
      </p>

      {/* Section 7 */}
      <h2 className="text-xl font-bold text-[#03296A] mt-8 mb-3">
        7. DOCUMENT RETENTION AND DISPOSAL
      </h2>
      <p className="mb-4">
        We retain client tax records for a minimum of seven years from the date of filing, as required
        by Internal Revenue Service guidelines and our professional standards. When we dispose of paper
        or electronic records containing personal information, we do so in a manner designed to render
        the information unreadable, including shredding paper documents and securely deleting
        electronic files.
      </p>

      {/* Section 8 */}
      <h2 className="text-xl font-bold text-[#03296A] mt-8 mb-3">
        8. YOUR RIGHTS REGARDING YOUR INFORMATION
      </h2>
      <p className="mb-4">You have the right to:</p>
      <ul className="list-disc pl-6 space-y-2 my-4">
        <li>Request a copy of the personal information we hold about you.</li>
        <li>Request correction of inaccurate information.</li>
        <li>
          Request that we delete information we no longer need to retain under tax law or other legal
          obligations.
        </li>
        <li>
          Withdraw consent for SMS communications by replying STOP, as described in Section 5.
        </li>
        <li>Withdraw consent for other communications by contacting our office.</li>
      </ul>
      <p className="mb-4">
        To exercise any of these rights, contact us at 954-934-0194 or info@hispanusa.com. We will
        respond within 30 days. Note that certain information must be retained for the full seven-year
        period under IRS rules and cannot be deleted earlier.
      </p>

      {/* Section 9 */}
      <h2 className="text-xl font-bold text-[#03296A] mt-8 mb-3">9. CALIFORNIA RESIDENTS</h2>
      <p className="mb-4">
        We extend the following rights to all California clients regardless of whether the California
        Consumer Privacy Act (&quot;CCPA&quot;) technically applies to our business:
      </p>
      <ul className="list-disc pl-6 space-y-2 my-4">
        <li>
          The right to know what personal information we have collected about you and how we use it.
        </li>
        <li>
          The right to request deletion of personal information we hold about you, subject to legal
          retention requirements.
        </li>
        <li>The right to correct inaccurate personal information.</li>
        <li>
          The right to opt out of the sale or sharing of your personal information. We do not sell or
          share personal information, so this right is exercised automatically.
        </li>
        <li>The right not to be discriminated against for exercising any of these rights.</li>
      </ul>
      <p className="mb-4">
        To exercise these rights, contact us at 954-934-0194 or info@hispanusa.com. We will respond
        within 45 days, with one 45-day extension permitted if reasonably necessary.
      </p>

      {/* Section 10 */}
      <h2 className="text-xl font-bold text-[#03296A] mt-8 mb-3">10. TEXAS RESIDENTS</h2>
      <p className="mb-4">
        We extend the following rights to all Texas clients regardless of whether the Texas Data
        Privacy and Security Act (&quot;TDPSA&quot;) technically applies to our business:
      </p>
      <ul className="list-disc pl-6 space-y-2 my-4">
        <li>
          The right to confirm whether we process your personal data and access that data.
        </li>
        <li>The right to correct inaccuracies in your personal data.</li>
        <li>
          The right to request deletion of your personal data, subject to legal retention
          requirements.
        </li>
        <li>The right to obtain a copy of your personal data in a portable format.</li>
        <li>
          The right to opt out of the sale of your personal data or its use for targeted advertising.
          We do not sell personal data or use it for targeted advertising.
        </li>
      </ul>
      <p className="mb-4">
        To exercise these rights, contact us at 954-934-0194 or info@hispanusa.com.
      </p>

      {/* Section 11 */}
      <h2 className="text-xl font-bold text-[#03296A] mt-8 mb-3">11. CHILDREN</h2>
      <p className="mb-4">
        Our services are for adults. We do not knowingly collect information from children under 13
        years of age except as part of preparing a tax return that includes information about dependent
        children. Information about dependent children is collected from the parent or guardian filing
        the return and is treated with the same protections as all other tax information.
      </p>

      {/* Section 12 */}
      <h2 className="text-xl font-bold text-[#03296A] mt-8 mb-3">
        12. NOTIFICATION OF SECURITY BREACHES
      </h2>
      <p className="mb-4">
        We comply with the Florida Information Protection Act, Florida Statutes &sect; 501.171. In the
        event we discover a security breach involving unauthorized access to personal information, we
        will notify affected individuals as required by law, and within the timeframes required by law.
        If a breach involves five hundred or more Florida residents, we will also notify the Florida
        Department of Legal Affairs as required by statute. For clients in other states, we will
        provide notice in accordance with applicable state breach notification laws.
      </p>

      {/* Section 13 */}
      <h2 className="text-xl font-bold text-[#03296A] mt-8 mb-3">
        13. FEDERAL TAX PREPARER OBLIGATIONS
      </h2>
      <p className="mb-4">
        As a paid tax preparer, we are subject to additional federal laws governing client information:
      </p>
      <ul className="list-disc pl-6 space-y-2 my-4">
        <li>
          Internal Revenue Code Section 7216 prohibits us from using or disclosing tax return
          information for any purpose other than preparing your tax return without your specific
          written consent.
        </li>
        <li>
          The Gramm-Leach-Bliley Act and the Federal Trade Commission Safeguards Rule require us to
          maintain administrative, technical, and physical safeguards to protect client financial
          information.
        </li>
        <li>
          IRS Publication 4557 provides guidance on safeguarding taxpayer data, which informs our
          practices.
        </li>
      </ul>

      {/* Section 14 */}
      <h2 className="text-xl font-bold text-[#03296A] mt-8 mb-3">14. THIRD-PARTY WEBSITES</h2>
      <p className="mb-4">
        Our website may contain links to third-party websites, including the IRS website, state tax
        agency websites, and social media platforms. This policy does not apply to information
        collected by those third-party websites. We encourage you to review the privacy policies of
        any third-party website you visit.
      </p>

      {/* Section 15 */}
      <h2 className="text-xl font-bold text-[#03296A] mt-8 mb-3">15. CHANGES TO THIS POLICY</h2>
      <p className="mb-4">
        We may update this policy from time to time. The &quot;Last Updated&quot; date at the top of
        this policy indicates when it was most recently changed. Material changes will be posted on our
        website. Your continued use of our services after changes are posted constitutes acceptance of
        the updated policy.
      </p>

      {/* Section 16 */}
      <h2 className="text-xl font-bold text-[#03296A] mt-8 mb-3">16. CONTACT US</h2>
      <p className="mb-4">
        For questions about this Privacy Policy, to exercise any of the rights described above, or to
        request information about our data practices, contact us at:
      </p>
      <address className="not-italic text-gray-700">
        <strong>HISPANUSA LLC</strong>
        <br />
        8050 North University Drive, Suite #206
        <br />
        Tamarac, FL 33321
        <br />
        Phone: 954-934-0194
        <br />
        Email: info@hispanusa.com
      </address>
    </>
  );
}

function SpanishContent() {
  return (
    <>
      <h1 className="text-3xl font-bold text-[#03296A] mb-2">POLÍTICA DE PRIVACIDAD</h1>
      <p className="text-sm text-gray-500 mb-8">
        Fecha de vigencia: 20 de mayo de 2026 &middot; Última actualización: 20 de mayo de 2026
      </p>

      <p className="mb-4">
        Esta Política de Privacidad describe cómo HISPANUSA LLC, operando bajo el nombre comercial
        HispanUSA Accounting &amp; Tax Services (&quot;HispanUSA,&quot; &quot;nosotros,&quot;
        &quot;nos&quot; o &quot;nuestro&quot;), recopila, utiliza, almacena y protege la información de
        nuestros clientes y visitantes del sitio web. Esta política se aplica a la información que
        recopilamos a través de nuestro sitio web en hispanusa.com, nuestro portal de citas en línea
        en book.hispanusa.com, las comunicaciones telefónicas y por mensajes de texto (SMS), el correo
        electrónico, el fax y las interacciones en persona en nuestra oficina.
      </p>

      <p className="mb-4">
        Si tiene preguntas sobre esta política, comuníquese con nosotros en:
      </p>
      <address className="not-italic mb-8 text-gray-700">
        <strong>HISPANUSA LLC</strong>
        <br />
        8050 North University Drive, Suite #206
        <br />
        Tamarac, FL 33321
        <br />
        Teléfono: 954-934-0194
        <br />
        Correo electrónico: info@hispanusa.com
      </address>

      {/* Sección 1 */}
      <h2 className="text-xl font-bold text-[#03296A] mt-8 mb-3">
        1. INFORMACIÓN QUE RECOPILAMOS
      </h2>
      <p className="mb-4">
        Recopilamos la información que usted nos proporciona directamente. Esto incluye:
      </p>
      <ul className="list-disc pl-6 space-y-2 my-4">
        <li>
          <strong>Información de contacto</strong>, como su nombre completo, dirección postal, número
          de teléfono y dirección de correo electrónico.
        </li>
        <li>
          <strong>Información para la preparación de impuestos</strong>, incluyendo números de Seguro
          Social, fechas de nacimiento, información de dependientes, documentos de ingresos (W-2,
          1099, K-1), registros de ingresos y gastos del negocio, información de cuentas bancarias
          para depósito directo, y cualquier otro documento necesario para preparar sus declaraciones
          de impuestos federales, estatales o locales.
        </li>
        <li>
          <strong>Información de contabilidad y teneduría de libros</strong>, incluyendo estados de
          cuenta bancarios, recibos, facturas, registros de nómina y otros documentos financieros que
          usted proporciona para servicios de contabilidad.
        </li>
        <li>
          <strong>Información de servicios profesionales</strong>, incluyendo documentos e información
          relacionados con consultoría de inmigración, divorcio, bancarrota, ofertas en compromiso
          (offer in compromise) y otros servicios profesionales que prestamos.
        </li>
        <li>
          <strong>Comunicaciones</strong>, incluyendo mensajes de texto, mensajes de voz, correos
          electrónicos, transmisiones de fax y notas de llamadas telefónicas o reuniones en persona.
        </li>
        <li>
          <strong>Información de citas</strong>, incluyendo la fecha, hora y tipo de cita que usted
          programa, y cualquier nota que usted proporcione sobre el propósito de su visita.
        </li>
      </ul>
      <p className="mb-4">
        También recopilamos automáticamente información limitada cuando usted visita nuestro sitio
        web, incluyendo su dirección IP, tipo de navegador, páginas vistas y la fecha y hora de su
        visita. Esta información es recopilada por herramientas estándar de hospedaje web y análisis.
      </p>

      {/* Sección 2 */}
      <h2 className="text-xl font-bold text-[#03296A] mt-8 mb-3">
        2. CÓMO USAMOS SU INFORMACIÓN
      </h2>
      <p className="mb-4">Usamos la información que recopilamos para:</p>
      <ul className="list-disc pl-6 space-y-2 my-4">
        <li>
          Preparar y presentar sus declaraciones de impuestos ante las autoridades fiscales federales,
          estatales y locales.
        </li>
        <li>
          Proporcionar servicios de contabilidad, teneduría de libros y servicios profesionales que
          usted nos ha contratado.
        </li>
        <li>
          Comunicarnos con usted sobre sus citas, el estado de su declaración de impuestos, documentos
          que necesitamos de usted y otros asuntos relacionados con los servicios que prestamos.
        </li>
        <li>
          Enviarle recordatorios y actualizaciones de citas por mensaje de texto (SMS) y correo
          electrónico (consulte la Sección 5 para detalles sobre comunicaciones SMS).
        </li>
        <li>
          Cumplir con nuestras obligaciones legales bajo la ley fiscal federal y estatal, incluyendo
          los requisitos de retención de registros impuestos por el Servicio de Impuestos Internos
          (IRS).
        </li>
        <li>
          Proteger contra fraude, robo de identidad y acceso no autorizado a su información.
        </li>
      </ul>

      {/* Sección 3 */}
      <h2 className="text-xl font-bold text-[#03296A] mt-8 mb-3">
        3. CÓMO COMPARTIMOS SU INFORMACIÓN
      </h2>
      <p className="mb-4">
        No vendemos su información personal. Compartimos información solamente cuando es necesario para
        prestar nuestros servicios o cuando la ley lo requiere. Específicamente:
      </p>
      <ul className="list-disc pl-6 space-y-2 my-4">
        <li>
          Divulgamos información al Servicio de Impuestos Internos (IRS), autoridades fiscales
          estatales y autoridades fiscales locales según sea requerido para preparar y presentar sus
          declaraciones de impuestos.
        </li>
        <li>
          Divulgamos información a terceros únicamente con su consentimiento específico por escrito,
          como cuando usted nos autoriza a compartir su declaración de impuestos con un prestamista,
          corredor hipotecario, abogado u otro profesional.
        </li>
        <li>
          Utilizamos proveedores de software de terceros para operar nuestra práctica, incluyendo
          software de preparación de impuestos, software de contabilidad, sistemas de gestión de
          documentos, servicios de teléfono y SMS, y servicios de correo electrónico. Estos
          proveedores procesan información en nuestro nombre y están contractualmente limitados a usar
          su información solamente para prestar servicios a nosotros.
        </li>
        <li>
          Podemos divulgar información cuando es requerido por citación judicial, orden judicial u otro
          proceso legal.
        </li>
        <li>
          En el caso de una venta, fusión o transferencia de nuestro negocio, la información de
          clientes podría ser transferida a la entidad adquirente, sujeta a las mismas protecciones
          descritas en esta política.
        </li>
      </ul>
      <p className="mb-4">
        <strong>Información que Usted Proporciona Sobre el Consentimiento SMS:</strong> Los números de
        teléfono móvil y el consentimiento para recibir mensajes SMS <strong>NUNCA</strong> se
        comparten con terceros o afiliados con fines de mercadeo. La información de consentimiento SMS
        se utiliza únicamente para enviarle los mensajes descritos en la Sección 5.
      </p>

      {/* Sección 4 */}
      <h2 className="text-xl font-bold text-[#03296A] mt-8 mb-3">
        4. SEGURIDAD Y ALMACENAMIENTO DE LA INFORMACIÓN
      </h2>
      <p className="mb-4">
        Almacenamos los documentos e información de los clientes en sistemas internos de oficina
        ubicados en nuestra oficina en 8050 North University Drive, Suite #206, Tamarac, FL 33321. El
        acceso a la información de los clientes está limitado al personal autorizado de HispanUSA
        usando computadoras de la oficina. Mantenemos copias de seguridad en sitio de la información
        de los clientes. Estamos en proceso de implementar capacidades adicionales de respaldo en la
        nube.
      </p>
      <p className="mb-4">
        Utilizamos servicios de software de terceros (incluyendo herramientas de preparación de
        impuestos, contabilidad y comunicación) que almacenan cierta información en los servidores
        seguros de los proveedores. Cada uno de estos proveedores mantiene sus propias prácticas de
        seguridad y está obligado a manejar su información de acuerdo con la ley aplicable.
      </p>
      <p className="mb-4">
        Ningún método de almacenamiento o transmisión electrónica es cien por ciento seguro. Aunque
        tomamos medidas razonables para proteger su información, no podemos garantizar seguridad
        absoluta.
      </p>

      {/* Sección 5 */}
      <h2 className="text-xl font-bold text-[#03296A] mt-8 mb-3">
        5. COMUNICACIONES POR MENSAJE DE TEXTO (SMS)
      </h2>
      <p className="mb-4">
        Si usted proporciona su número de teléfono móvil y da su consentimiento para recibir
        comunicaciones por SMS, le enviaremos mensajes de texto relacionados con los servicios que
        prestamos.
      </p>
      <p className="mb-2 font-semibold">Tipos de mensajes que enviamos:</p>
      <ul className="list-disc pl-6 space-y-2 my-4">
        <li>Confirmaciones de citas después de que usted reserve una cita con nosotros.</li>
        <li>Recordatorios antes de su cita programada.</li>
        <li>
          Mensajes con listas de documentos indicándole qué traer o enviar para su cita.
        </li>
        <li>Actualizaciones sobre el estado de su declaración de impuestos u otros servicios.</li>
        <li>Respuestas a preguntas que usted nos envíe por mensaje de texto.</li>
      </ul>
      <p className="mb-4">
        <strong>Frecuencia de mensajes:</strong> Usted puede esperar recibir aproximadamente de 1 a 5
        mensajes por ciclo de cita. La frecuencia de mensajes varía según los servicios que nos haya
        contratado.
      </p>
      <p className="mb-4">
        <strong>Tarifas de mensajes y datos:</strong> Pueden aplicarse las tarifas estándar de
        mensajes y datos según su operador de telefonía móvil y su plan. HispanUSA no cobra por los
        mensajes SMS, pero su operador podría hacerlo.
      </p>
      <p className="mb-4">
        <strong>Cómo cancelar la suscripción:</strong> Usted puede dejar de recibir mensajes SMS en
        cualquier momento respondiendo <strong>STOP</strong> a cualquier mensaje de texto que reciba de
        nosotros. Después de responder STOP, recibirá un mensaje de confirmación y no recibirá más
        mensajes SMS de nosotros. Continuará recibiendo comunicaciones no-SMS (correo electrónico,
        teléfono, correo postal) sobre sus servicios a menos que también cancele esos canales.
      </p>
      <p className="mb-4">
        <strong>Cómo obtener ayuda:</strong> Responda <strong>HELP</strong> (AYUDA) a cualquier
        mensaje de texto para recibir información de contacto. También puede llamar a nuestra oficina
        al 954-934-0194 o enviarnos un correo electrónico a info@hispanusa.com.
      </p>
      <p className="mb-4">
        <strong>La información SMS no se comparte:</strong> Su número de teléfono móvil y el hecho de
        que haya dado consentimiento para recibir comunicaciones SMS nunca se comparten con terceros o
        afiliados con fines de mercadeo.
      </p>
      <p className="mb-4">
        <strong>Operadores compatibles:</strong> Los mensajes SMS son compatibles con todos los
        principales operadores inalámbricos de los Estados Unidos. Los operadores no son responsables
        de los mensajes retrasados o no entregados.
      </p>

      {/* Sección 6 */}
      <h2 className="text-xl font-bold text-[#03296A] mt-8 mb-3">
        6. CORREO ELECTRÓNICO Y OTRAS COMUNICACIONES
      </h2>
      <p className="mb-4">
        Enviamos correos electrónicos transaccionales sobre sus citas, declaraciones de impuestos y
        cuenta desde direcciones que incluyen appointments@hispanusa.com, taxes@hispanusa.com,
        accounting@hispanusa.com e info@hispanusa.com. No enviamos correos electrónicos de mercadeo no
        solicitados. Si alguna vez enviamos un boletín informativo o mensaje promocional, cada uno de
        esos mensajes incluirá un enlace para cancelar la suscripción.
      </p>

      {/* Sección 7 */}
      <h2 className="text-xl font-bold text-[#03296A] mt-8 mb-3">
        7. RETENCIÓN Y DESECHO DE DOCUMENTOS
      </h2>
      <p className="mb-4">
        Retenemos los registros fiscales de los clientes por un mínimo de siete años desde la fecha de
        presentación, según lo requerido por las pautas del Servicio de Impuestos Internos y nuestras
        normas profesionales. Cuando desechamos registros en papel o electrónicos que contienen
        información personal, lo hacemos de manera diseñada para hacer la información ilegible,
        incluyendo trituración de documentos en papel y eliminación segura de archivos electrónicos.
      </p>

      {/* Sección 8 */}
      <h2 className="text-xl font-bold text-[#03296A] mt-8 mb-3">
        8. SUS DERECHOS SOBRE SU INFORMACIÓN
      </h2>
      <p className="mb-4">Usted tiene derecho a:</p>
      <ul className="list-disc pl-6 space-y-2 my-4">
        <li>Solicitar una copia de la información personal que tenemos sobre usted.</li>
        <li>Solicitar corrección de información inexacta.</li>
        <li>
          Solicitar que eliminemos información que ya no necesitamos retener bajo la ley fiscal u otras
          obligaciones legales.
        </li>
        <li>
          Retirar el consentimiento para comunicaciones SMS respondiendo STOP, como se describe en la
          Sección 5.
        </li>
        <li>Retirar el consentimiento para otras comunicaciones contactando a nuestra oficina.</li>
      </ul>
      <p className="mb-4">
        Para ejercer cualquiera de estos derechos, contáctenos al 954-934-0194 o info@hispanusa.com.
        Responderemos dentro de 30 días. Tenga en cuenta que cierta información debe ser retenida
        durante el período completo de siete años bajo las reglas del IRS y no puede ser eliminada
        antes.
      </p>

      {/* Sección 9 */}
      <h2 className="text-xl font-bold text-[#03296A] mt-8 mb-3">
        9. RESIDENTES DE CALIFORNIA
      </h2>
      <p className="mb-4">
        Extendemos los siguientes derechos a todos los clientes de California sin importar si la Ley
        de Privacidad del Consumidor de California (&quot;CCPA&quot;) técnicamente se aplica a nuestro
        negocio:
      </p>
      <ul className="list-disc pl-6 space-y-2 my-4">
        <li>
          El derecho a saber qué información personal hemos recopilado sobre usted y cómo la usamos.
        </li>
        <li>
          El derecho a solicitar la eliminación de la información personal que tenemos sobre usted,
          sujeto a requisitos legales de retención.
        </li>
        <li>El derecho a corregir información personal inexacta.</li>
        <li>
          El derecho a optar por no participar en la venta o intercambio de su información personal.
          No vendemos ni intercambiamos información personal, por lo que este derecho se ejerce
          automáticamente.
        </li>
        <li>
          El derecho a no ser discriminado por ejercer cualquiera de estos derechos.
        </li>
      </ul>
      <p className="mb-4">
        Para ejercer estos derechos, contáctenos al 954-934-0194 o info@hispanusa.com. Responderemos
        dentro de 45 días, con una extensión adicional de 45 días permitida si es razonablemente
        necesario.
      </p>

      {/* Sección 10 */}
      <h2 className="text-xl font-bold text-[#03296A] mt-8 mb-3">10. RESIDENTES DE TEXAS</h2>
      <p className="mb-4">
        Extendemos los siguientes derechos a todos los clientes de Texas sin importar si la Ley de
        Privacidad y Seguridad de Datos de Texas (&quot;TDPSA&quot;) técnicamente se aplica a nuestro
        negocio:
      </p>
      <ul className="list-disc pl-6 space-y-2 my-4">
        <li>
          El derecho a confirmar si procesamos sus datos personales y acceder a esos datos.
        </li>
        <li>El derecho a corregir inexactitudes en sus datos personales.</li>
        <li>
          El derecho a solicitar la eliminación de sus datos personales, sujeto a requisitos legales
          de retención.
        </li>
        <li>
          El derecho a obtener una copia de sus datos personales en un formato portátil.
        </li>
        <li>
          El derecho a optar por no participar en la venta de sus datos personales o su uso para
          publicidad dirigida. No vendemos datos personales ni los usamos para publicidad dirigida.
        </li>
      </ul>
      <p className="mb-4">
        Para ejercer estos derechos, contáctenos al 954-934-0194 o info@hispanusa.com.
      </p>

      {/* Sección 11 */}
      <h2 className="text-xl font-bold text-[#03296A] mt-8 mb-3">11. NIÑOS</h2>
      <p className="mb-4">
        Nuestros servicios son para adultos. No recopilamos a sabiendas información de niños menores
        de 13 años, excepto como parte de la preparación de una declaración de impuestos que incluye
        información sobre hijos dependientes. La información sobre hijos dependientes se recopila del
        padre, madre o tutor que presenta la declaración y se trata con las mismas protecciones que
        toda otra información fiscal.
      </p>

      {/* Sección 12 */}
      <h2 className="text-xl font-bold text-[#03296A] mt-8 mb-3">
        12. NOTIFICACIÓN DE VIOLACIONES DE SEGURIDAD
      </h2>
      <p className="mb-4">
        Cumplimos con la Ley de Protección de Información de Florida, Estatutos de Florida &sect;
        501.171. En caso de que descubramos una violación de seguridad que involucre acceso no
        autorizado a información personal, notificaremos a las personas afectadas según lo requerido
        por la ley, y dentro de los plazos requeridos por la ley. Si una violación involucra a
        quinientos o más residentes de Florida, también notificaremos al Departamento de Asuntos
        Legales de Florida según lo requerido por estatuto. Para clientes en otros estados,
        proporcionaremos notificación de acuerdo con las leyes estatales aplicables de notificación de
        violaciones.
      </p>

      {/* Sección 13 */}
      <h2 className="text-xl font-bold text-[#03296A] mt-8 mb-3">
        13. OBLIGACIONES FEDERALES DEL PREPARADOR DE IMPUESTOS
      </h2>
      <p className="mb-4">
        Como preparador de impuestos pagado, estamos sujetos a leyes federales adicionales que rigen
        la información de los clientes:
      </p>
      <ul className="list-disc pl-6 space-y-2 my-4">
        <li>
          La Sección 7216 del Código de Rentas Internas nos prohíbe usar o divulgar información de
          declaraciones de impuestos para cualquier propósito que no sea la preparación de su
          declaración de impuestos sin su consentimiento específico por escrito.
        </li>
        <li>
          La Ley Gramm-Leach-Bliley y la Regla de Salvaguardas de la Comisión Federal de Comercio nos
          exigen mantener salvaguardas administrativas, técnicas y físicas para proteger la información
          financiera de los clientes.
        </li>
        <li>
          La Publicación 4557 del IRS proporciona orientación sobre la protección de los datos de los
          contribuyentes, lo cual informa nuestras prácticas.
        </li>
      </ul>

      {/* Sección 14 */}
      <h2 className="text-xl font-bold text-[#03296A] mt-8 mb-3">
        14. SITIOS WEB DE TERCEROS
      </h2>
      <p className="mb-4">
        Nuestro sitio web puede contener enlaces a sitios web de terceros, incluyendo el sitio web del
        IRS, sitios web de agencias fiscales estatales y plataformas de redes sociales. Esta política
        no se aplica a la información recopilada por esos sitios web de terceros. Le recomendamos
        revisar las políticas de privacidad de cualquier sitio web de terceros que visite.
      </p>

      {/* Sección 15 */}
      <h2 className="text-xl font-bold text-[#03296A] mt-8 mb-3">
        15. CAMBIOS A ESTA POLÍTICA
      </h2>
      <p className="mb-4">
        Podemos actualizar esta política de vez en cuando. La fecha de &quot;Última
        actualización&quot; en la parte superior de esta política indica cuándo fue cambiada más
        recientemente. Los cambios materiales serán publicados en nuestro sitio web. Su uso continuado
        de nuestros servicios después de publicados los cambios constituye aceptación de la política
        actualizada.
      </p>

      {/* Sección 16 */}
      <h2 className="text-xl font-bold text-[#03296A] mt-8 mb-3">16. CONTÁCTENOS</h2>
      <p className="mb-4">
        Para preguntas sobre esta Política de Privacidad, para ejercer cualquiera de los derechos
        descritos anteriormente, o para solicitar información sobre nuestras prácticas de datos,
        contáctenos en:
      </p>
      <address className="not-italic text-gray-700">
        <strong>HISPANUSA LLC</strong>
        <br />
        8050 North University Drive, Suite #206
        <br />
        Tamarac, FL 33321
        <br />
        Teléfono: 954-934-0194
        <br />
        Correo electrónico: info@hispanusa.com
      </address>
    </>
  );
}

export default function PrivacyPolicyPage() {
  return (
    <LegalPageLayout
      englishContent={<EnglishContent />}
      spanishContent={<SpanishContent />}
    />
  );
}
