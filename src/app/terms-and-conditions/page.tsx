import { Metadata } from 'next';
import LegalPageLayout from '@/components/legal/LegalPageLayout';

export const metadata: Metadata = {
  title: 'Terms and Conditions | HispanUSA Accounting & Tax Services',
  description:
    'Terms and conditions for using HispanUSA Accounting & Tax Services, including appointments, services, and communications.',
};

function EnglishContent() {
  return (
    <>
      <h1 className="text-3xl font-bold text-[#03296A] mb-2">TERMS AND CONDITIONS</h1>
      <p className="text-sm text-gray-500 mb-8">
        Effective Date: May 20, 2026 &middot; Last Updated: May 20, 2026
      </p>

      <p className="mb-4">
        These Terms and Conditions (&quot;Terms&quot;) govern your use of the website at
        hispanusa.com, the client booking portal at book.hispanusa.com, and any services provided by
        HISPANUSA LLC, doing business as HispanUSA Accounting &amp; Tax Services (&quot;HispanUSA,&quot;
        &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;). By using our website, booking an
        appointment, engaging our services, or providing your contact information, you agree to these
        Terms.
      </p>

      {/* Section 1 */}
      <h2 className="text-xl font-bold text-[#03296A] mt-8 mb-3">1. ABOUT US</h2>
      <p className="mb-4">
        HISPANUSA LLC is a Florida limited liability company located at 8050 North University Drive,
        Suite #206, Tamarac, FL 33321. We provide tax preparation, accounting, bookkeeping, and
        professional services including immigration consulting, divorce assistance, bankruptcy
        assistance, and offer in compromise representation.
      </p>
      <p className="mb-4">
        Contact:
        <br />
        Phone: 954-934-0194
        <br />
        Email: info@hispanusa.com
      </p>

      {/* Section 2 */}
      <h2 className="text-xl font-bold text-[#03296A] mt-8 mb-3">2. SERVICES WE PROVIDE</h2>
      <p className="mb-4">We offer the following categories of services:</p>
      <ul className="list-disc pl-6 space-y-2 my-4">
        <li>
          <strong>Personal tax preparation</strong>, including federal and state individual income tax
          returns.
        </li>
        <li>
          <strong>Corporate tax preparation</strong>, including federal and state returns for
          corporations, partnerships, and LLCs, which generally includes the personal returns of the
          business owners.
        </li>
        <li>
          <strong>Accounting and bookkeeping services</strong> for businesses and self-employed
          individuals.
        </li>
        <li>
          <strong>Professional services</strong> including immigration consulting, divorce assistance,
          bankruptcy assistance, general consulting, and offer in compromise representation.
        </li>
      </ul>
      <p className="mb-4">
        The specific scope of services for any client engagement is defined in the engagement letter or
        written agreement we provide before beginning work.
      </p>

      {/* Section 3 */}
      <h2 className="text-xl font-bold text-[#03296A] mt-8 mb-3">3. APPOINTMENTS AND BOOKING</h2>
      <p className="mb-4">
        You can schedule appointments by calling our office at 954-934-0194, by visiting our office in
        person, or by using our online booking portal at book.hispanusa.com.
      </p>
      <p className="mb-4">
        Online appointments scheduled through the booking portal are subject to confirmation by our
        office. After you submit an online booking request, you will receive a confirmation email or
        text message. If we are unable to accommodate the requested time, we will contact you to
        reschedule.
      </p>
      <p className="mb-2 font-semibold">Office hours:</p>
      <ul className="list-disc pl-6 space-y-2 my-4">
        <li>
          <strong>Regular season</strong> (April 16 through January 14): Monday through Friday, 9:00
          AM to 5:00 PM.
        </li>
        <li>
          <strong>Tax season</strong> (January 15 through April 15): Monday through Saturday, 9:00 AM
          to 7:00 PM.
        </li>
      </ul>
      <p className="mb-4">
        <strong>Cancellations and rescheduling:</strong> We ask that you provide at least 24 hours
        notice if you need to cancel or reschedule an appointment. To cancel or reschedule, call our
        office at 954-934-0194.
      </p>

      {/* Section 4 */}
      <h2 className="text-xl font-bold text-[#03296A] mt-8 mb-3">4. CLIENT RESPONSIBILITIES</h2>
      <p className="mb-4">
        To provide accurate and timely services, we rely on the information and documents you provide.
        You agree to:
      </p>
      <ul className="list-disc pl-6 space-y-2 my-4">
        <li>Provide complete, accurate, and truthful information.</li>
        <li>
          Provide all documents necessary for the services you have engaged us to perform.
        </li>
        <li>
          Review any tax return, document, or filing we prepare before it is submitted and notify us
          immediately if you identify any errors.
        </li>
        <li>Respond promptly to requests for additional information or clarification.</li>
        <li>
          Pay for services in accordance with the fees and payment terms communicated to you.
        </li>
      </ul>
      <p className="mb-4">
        You acknowledge that the accuracy of our work depends on the accuracy and completeness of the
        information you provide.
      </p>

      {/* Section 5 */}
      <h2 className="text-xl font-bold text-[#03296A] mt-8 mb-3">5. FEES AND PAYMENT</h2>
      <p className="mb-4">
        Fees for our services are based on the complexity of the work performed, the time required, and
        the type of service provided. Fees are communicated to you before services begin, either
        verbally, by written estimate, or in an engagement letter.
      </p>
      <p className="mb-4">
        Payment is generally due upon completion of services. We accept cash, check, and major credit
        cards. Returned checks are subject to a returned check fee plus any fees charged by our bank.
      </p>
      <p className="mb-4">
        If you do not pay within 30 days of the date services are completed, we may charge interest at
        the maximum rate permitted by Florida law and may suspend further services until your balance
        is paid.
      </p>

      {/* Section 6 */}
      <h2 className="text-xl font-bold text-[#03296A] mt-8 mb-3">
        6. SMS / TEXT MESSAGE COMMUNICATIONS
      </h2>
      <p className="mb-4">
        By providing your mobile phone number and opting in to SMS communications during the booking
        process or in person, you consent to receive text messages from HispanUSA related to the
        services we provide. Full details about SMS communications, including message types, frequency,
        opt-out instructions, and message and data rates, are described in our Privacy Policy at
        book.hispanusa.com/privacy-policy.
      </p>
      <p className="mb-4">
        Briefly: You can opt out at any time by replying <strong>STOP</strong>. Reply{' '}
        <strong>HELP</strong> for assistance. Standard message and data rates may apply. We do not
        share your mobile number with third parties.
      </p>

      {/* Section 7 */}
      <h2 className="text-xl font-bold text-[#03296A] mt-8 mb-3">7. CONFIDENTIALITY</h2>
      <p className="mb-4">
        We treat all client information as confidential. Information provided to us in the course of
        our services is protected by:
      </p>
      <ul className="list-disc pl-6 space-y-2 my-4">
        <li>
          Our professional obligations as tax preparers under Internal Revenue Code Section 7216,
          which prohibits us from disclosing tax return information without your written consent except
          as required by law.
        </li>
        <li>
          Our obligations under the Gramm-Leach-Bliley Act and the Federal Trade Commission
          Safeguards Rule.
        </li>
        <li>
          Our internal practices for handling client information, as described in our Privacy Policy.
        </li>
      </ul>

      {/* Section 8 */}
      <h2 className="text-xl font-bold text-[#03296A] mt-8 mb-3">8. INTELLECTUAL PROPERTY</h2>
      <p className="mb-4">
        Tax returns, financial statements, and other deliverables prepared for you are your property
        once payment is complete. The templates, processes, software, methodologies, and know-how we
        use to provide our services remain our property. Content on our website at hispanusa.com,
        including text, logos, and images, is the property of HISPANUSA LLC and may not be reproduced
        without our written permission.
      </p>

      {/* Section 9 */}
      <h2 className="text-xl font-bold text-[#03296A] mt-8 mb-3">9. LIMITATION OF LIABILITY</h2>
      <p className="mb-4">To the maximum extent permitted by Florida law:</p>
      <ul className="list-disc pl-6 space-y-2 my-4">
        <li>
          Our liability for any error in services we provide is limited to the fees you paid for the
          specific service in which the error occurred.
        </li>
        <li>
          We are not liable for any indirect, incidental, consequential, or punitive damages,
          including lost profits or lost opportunities.
        </li>
        <li>
          We are not liable for penalties or interest assessed by any taxing authority due to
          information you failed to provide, provided inaccurately, or provided late.
        </li>
        <li>
          We are not liable for delays caused by circumstances beyond our reasonable control,
          including delays by the IRS, state tax agencies, banks, or third-party software providers.
        </li>
      </ul>
      <p className="mb-4">
        Nothing in this section limits any liability that cannot be limited under applicable law,
        including liability for fraud or willful misconduct.
      </p>

      {/* Section 10 */}
      <h2 className="text-xl font-bold text-[#03296A] mt-8 mb-3">10. NO GUARANTEE OF OUTCOMES</h2>
      <p className="mb-4">
        We use professional judgment to prepare your tax returns and provide other services. We do not
        guarantee any specific outcome, including the size of any refund, the amount of any tax owed,
        the approval of any immigration application, or the outcome of any negotiation with the IRS or
        other agency. Tax positions, immigration outcomes, and similar matters are inherently subject
        to the discretion of government agencies.
      </p>

      {/* Section 11 */}
      <h2 className="text-xl font-bold text-[#03296A] mt-8 mb-3">11. INDEMNIFICATION</h2>
      <p className="mb-4">
        You agree to indemnify and hold harmless HispanUSA and our staff from any claim, loss, or
        liability arising from your provision of inaccurate or incomplete information to us, or your
        failure to comply with any law or regulation related to the matters on which we provide
        services.
      </p>

      {/* Section 12 */}
      <h2 className="text-xl font-bold text-[#03296A] mt-8 mb-3">12. TERMINATION</h2>
      <p className="mb-4">
        Either party may terminate the services relationship at any time, with or without cause, by
        providing written notice. If you terminate before services are complete, you remain responsible
        for fees for work performed up to the date of termination. If we terminate, we will return
        your documents promptly and, where appropriate, refund any prepaid fees for work not yet
        performed.
      </p>

      {/* Section 13 */}
      <h2 className="text-xl font-bold text-[#03296A] mt-8 mb-3">
        13. GOVERNING LAW AND DISPUTES
      </h2>
      <p className="mb-4">
        These Terms are governed by the laws of the State of Florida. Any dispute arising out of or
        related to these Terms or our services will be resolved in the state or federal courts located
        in Broward County, Florida, and you consent to the exclusive jurisdiction of those courts.
      </p>
      <p className="mb-4">
        Before filing any lawsuit, you agree to first attempt to resolve any dispute by contacting us
        in writing and providing us a reasonable opportunity to address your concern.
      </p>

      {/* Section 14 */}
      <h2 className="text-xl font-bold text-[#03296A] mt-8 mb-3">14. CHANGES TO THESE TERMS</h2>
      <p className="mb-4">
        We may update these Terms from time to time. The &quot;Last Updated&quot; date at the top of
        these Terms indicates when they were most recently changed. Material changes will be posted on
        our website. Your continued use of our services after changes are posted constitutes acceptance
        of the updated Terms.
      </p>

      {/* Section 15 */}
      <h2 className="text-xl font-bold text-[#03296A] mt-8 mb-3">15. SEVERABILITY</h2>
      <p className="mb-4">
        If any provision of these Terms is found to be unenforceable, the remaining provisions remain
        in effect.
      </p>

      {/* Section 16 */}
      <h2 className="text-xl font-bold text-[#03296A] mt-8 mb-3">16. ENTIRE AGREEMENT</h2>
      <p className="mb-4">
        These Terms, together with our Privacy Policy and any engagement letter or written agreement we
        provide for specific services, constitute the entire agreement between you and HispanUSA
        regarding our services and supersede any prior oral or written understandings.
      </p>

      {/* Section 17 */}
      <h2 className="text-xl font-bold text-[#03296A] mt-8 mb-3">17. CONTACT US</h2>
      <p className="mb-4">For questions about these Terms, contact us at:</p>
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
      <h1 className="text-3xl font-bold text-[#03296A] mb-2">TÉRMINOS Y CONDICIONES</h1>
      <p className="text-sm text-gray-500 mb-8">
        Fecha de vigencia: 20 de mayo de 2026 &middot; Última actualización: 20 de mayo de 2026
      </p>

      <p className="mb-4">
        Estos Términos y Condiciones (&quot;Términos&quot;) rigen su uso del sitio web en
        hispanusa.com, el portal de citas en book.hispanusa.com, y cualquier servicio proporcionado
        por HISPANUSA LLC, operando bajo el nombre comercial HispanUSA Accounting &amp; Tax Services
        (&quot;HispanUSA,&quot; &quot;nosotros,&quot; &quot;nos&quot; o &quot;nuestro&quot;). Al usar
        nuestro sitio web, reservar una cita, contratar nuestros servicios o proporcionar su
        información de contacto, usted acepta estos Términos.
      </p>

      {/* Sección 1 */}
      <h2 className="text-xl font-bold text-[#03296A] mt-8 mb-3">1. ACERCA DE NOSOTROS</h2>
      <p className="mb-4">
        HISPANUSA LLC es una compañía de responsabilidad limitada de Florida ubicada en 8050 North
        University Drive, Suite #206, Tamarac, FL 33321. Prestamos servicios de preparación de
        impuestos, contabilidad, teneduría de libros y servicios profesionales que incluyen consultoría
        de inmigración, asistencia con divorcios, asistencia con bancarrota y representación en
        ofertas en compromiso.
      </p>
      <p className="mb-4">
        Contacto:
        <br />
        Teléfono: 954-934-0194
        <br />
        Correo electrónico: info@hispanusa.com
      </p>

      {/* Sección 2 */}
      <h2 className="text-xl font-bold text-[#03296A] mt-8 mb-3">
        2. SERVICIOS QUE PRESTAMOS
      </h2>
      <p className="mb-4">Ofrecemos las siguientes categorías de servicios:</p>
      <ul className="list-disc pl-6 space-y-2 my-4">
        <li>
          <strong>Preparación de impuestos personales</strong>, incluyendo declaraciones federales y
          estatales de ingresos individuales.
        </li>
        <li>
          <strong>Preparación de impuestos corporativos</strong>, incluyendo declaraciones federales y
          estatales para corporaciones, sociedades y LLCs, lo cual generalmente incluye las
          declaraciones personales de los dueños del negocio.
        </li>
        <li>
          <strong>Servicios de contabilidad y teneduría de libros</strong> para negocios e individuos
          por cuenta propia.
        </li>
        <li>
          <strong>Servicios profesionales</strong> que incluyen consultoría de inmigración, asistencia
          con divorcios, asistencia con bancarrota, consultoría general y representación en ofertas en
          compromiso.
        </li>
      </ul>
      <p className="mb-4">
        El alcance específico de los servicios para cualquier contratación de cliente se define en la
        carta de contratación o acuerdo por escrito que proporcionamos antes de comenzar el trabajo.
      </p>

      {/* Sección 3 */}
      <h2 className="text-xl font-bold text-[#03296A] mt-8 mb-3">3. CITAS Y RESERVAS</h2>
      <p className="mb-4">
        Usted puede programar citas llamando a nuestra oficina al 954-934-0194, visitando nuestra
        oficina en persona, o usando nuestro portal de citas en línea en book.hispanusa.com.
      </p>
      <p className="mb-4">
        Las citas en línea programadas a través del portal de reservas están sujetas a confirmación por
        nuestra oficina. Después de que usted envíe una solicitud de cita en línea, recibirá un correo
        electrónico o mensaje de texto de confirmación. Si no podemos acomodar la hora solicitada, lo
        contactaremos para reprogramar.
      </p>
      <p className="mb-2 font-semibold">Horario de oficina:</p>
      <ul className="list-disc pl-6 space-y-2 my-4">
        <li>
          <strong>Temporada regular</strong> (16 de abril al 14 de enero): lunes a viernes, 9:00 AM a
          5:00 PM.
        </li>
        <li>
          <strong>Temporada de impuestos</strong> (15 de enero al 15 de abril): lunes a sábado, 9:00
          AM a 7:00 PM.
        </li>
      </ul>
      <p className="mb-4">
        <strong>Cancelaciones y reprogramaciones:</strong> Le pedimos que proporcione al menos 24 horas
        de aviso si necesita cancelar o reprogramar una cita. Para cancelar o reprogramar, llame a
        nuestra oficina al 954-934-0194.
      </p>

      {/* Sección 4 */}
      <h2 className="text-xl font-bold text-[#03296A] mt-8 mb-3">
        4. RESPONSABILIDADES DEL CLIENTE
      </h2>
      <p className="mb-4">
        Para prestar servicios precisos y oportunos, dependemos de la información y documentos que
        usted proporciona. Usted se compromete a:
      </p>
      <ul className="list-disc pl-6 space-y-2 my-4">
        <li>Proporcionar información completa, precisa y veraz.</li>
        <li>
          Proporcionar todos los documentos necesarios para los servicios que nos ha contratado.
        </li>
        <li>
          Revisar cualquier declaración de impuestos, documento o presentación que preparemos antes de
          que sea presentada y notificarnos inmediatamente si identifica cualquier error.
        </li>
        <li>Responder oportunamente a solicitudes de información o aclaración adicional.</li>
        <li>
          Pagar por los servicios de acuerdo con las tarifas y términos de pago que le hayan sido
          comunicados.
        </li>
      </ul>
      <p className="mb-4">
        Usted reconoce que la precisión de nuestro trabajo depende de la precisión e integridad de la
        información que usted proporciona.
      </p>

      {/* Sección 5 */}
      <h2 className="text-xl font-bold text-[#03296A] mt-8 mb-3">5. TARIFAS Y PAGO</h2>
      <p className="mb-4">
        Las tarifas por nuestros servicios se basan en la complejidad del trabajo realizado, el tiempo
        requerido y el tipo de servicio prestado. Las tarifas se le comunican antes de que comiencen
        los servicios, ya sea verbalmente, mediante estimación por escrito o en una carta de
        contratación.
      </p>
      <p className="mb-4">
        El pago generalmente es debido al completar los servicios. Aceptamos efectivo, cheque y
        tarjetas de crédito principales. Los cheques devueltos están sujetos a una tarifa por cheque
        devuelto más cualquier cargo cobrado por nuestro banco.
      </p>
      <p className="mb-4">
        Si usted no paga dentro de 30 días desde la fecha de completados los servicios, podemos cobrar
        intereses a la tasa máxima permitida por la ley de Florida y podemos suspender servicios
        adicionales hasta que su saldo sea pagado.
      </p>

      {/* Sección 6 */}
      <h2 className="text-xl font-bold text-[#03296A] mt-8 mb-3">
        6. COMUNICACIONES POR MENSAJE DE TEXTO (SMS)
      </h2>
      <p className="mb-4">
        Al proporcionar su número de teléfono móvil y dar su consentimiento para comunicaciones SMS
        durante el proceso de reserva o en persona, usted consiente recibir mensajes de texto de
        HispanUSA relacionados con los servicios que prestamos. Los detalles completos sobre las
        comunicaciones SMS, incluyendo tipos de mensajes, frecuencia, instrucciones para cancelar la
        suscripción, y tarifas de mensajes y datos, se describen en nuestra Política de Privacidad en
        book.hispanusa.com/privacy-policy.
      </p>
      <p className="mb-4">
        Brevemente: Puede cancelar la suscripción en cualquier momento respondiendo{' '}
        <strong>STOP</strong>. Responda <strong>HELP</strong> (AYUDA) para asistencia. Pueden
        aplicarse tarifas estándar de mensajes y datos. No compartimos su número de teléfono móvil con
        terceros.
      </p>

      {/* Sección 7 */}
      <h2 className="text-xl font-bold text-[#03296A] mt-8 mb-3">7. CONFIDENCIALIDAD</h2>
      <p className="mb-4">
        Tratamos toda la información del cliente como confidencial. La información proporcionada a
        nosotros en el curso de nuestros servicios está protegida por:
      </p>
      <ul className="list-disc pl-6 space-y-2 my-4">
        <li>
          Nuestras obligaciones profesionales como preparadores de impuestos bajo la Sección 7216 del
          Código de Rentas Internas, que nos prohíbe divulgar información de declaraciones de
          impuestos sin su consentimiento por escrito excepto cuando es requerido por la ley.
        </li>
        <li>
          Nuestras obligaciones bajo la Ley Gramm-Leach-Bliley y la Regla de Salvaguardas de la
          Comisión Federal de Comercio.
        </li>
        <li>
          Nuestras prácticas internas para el manejo de información de clientes, como se describe en
          nuestra Política de Privacidad.
        </li>
      </ul>

      {/* Sección 8 */}
      <h2 className="text-xl font-bold text-[#03296A] mt-8 mb-3">8. PROPIEDAD INTELECTUAL</h2>
      <p className="mb-4">
        Las declaraciones de impuestos, estados financieros y otros entregables preparados para usted
        son de su propiedad una vez completado el pago. Las plantillas, procesos, software,
        metodologías y conocimientos técnicos que usamos para prestar nuestros servicios permanecen
        como nuestra propiedad. El contenido en nuestro sitio web en hispanusa.com, incluyendo texto,
        logotipos e imágenes, es propiedad de HISPANUSA LLC y no puede ser reproducido sin nuestro
        permiso por escrito.
      </p>

      {/* Sección 9 */}
      <h2 className="text-xl font-bold text-[#03296A] mt-8 mb-3">
        9. LIMITACIÓN DE RESPONSABILIDAD
      </h2>
      <p className="mb-4">En la máxima medida permitida por la ley de Florida:</p>
      <ul className="list-disc pl-6 space-y-2 my-4">
        <li>
          Nuestra responsabilidad por cualquier error en los servicios que prestamos se limita a las
          tarifas que usted pagó por el servicio específico en el que ocurrió el error.
        </li>
        <li>
          No somos responsables por daños indirectos, incidentales, consecuentes o punitivos,
          incluyendo lucro cesante u oportunidades perdidas.
        </li>
        <li>
          No somos responsables por multas o intereses cobrados por cualquier autoridad fiscal debido a
          información que usted no proporcionó, proporcionó de manera inexacta o proporcionó tarde.
        </li>
        <li>
          No somos responsables por retrasos causados por circunstancias fuera de nuestro control
          razonable, incluyendo retrasos del IRS, agencias fiscales estatales, bancos o proveedores de
          software de terceros.
        </li>
      </ul>
      <p className="mb-4">
        Nada en esta sección limita ninguna responsabilidad que no pueda ser limitada bajo la ley
        aplicable, incluyendo responsabilidad por fraude o conducta dolosa.
      </p>

      {/* Sección 10 */}
      <h2 className="text-xl font-bold text-[#03296A] mt-8 mb-3">
        10. SIN GARANTÍA DE RESULTADOS
      </h2>
      <p className="mb-4">
        Usamos juicio profesional para preparar sus declaraciones de impuestos y prestar otros
        servicios. No garantizamos ningún resultado específico, incluyendo el monto de cualquier
        reembolso, el monto de cualquier impuesto adeudado, la aprobación de cualquier solicitud de
        inmigración, o el resultado de cualquier negociación con el IRS u otra agencia. Las posiciones
        fiscales, resultados de inmigración y asuntos similares están inherentemente sujetos a la
        discreción de las agencias gubernamentales.
      </p>

      {/* Sección 11 */}
      <h2 className="text-xl font-bold text-[#03296A] mt-8 mb-3">11. INDEMNIZACIÓN</h2>
      <p className="mb-4">
        Usted se compromete a indemnizar y mantener indemne a HispanUSA y a nuestro personal de
        cualquier reclamo, pérdida o responsabilidad que surja de su provisión de información inexacta
        o incompleta a nosotros, o su incumplimiento con cualquier ley o regulación relacionada con
        los asuntos sobre los cuales prestamos servicios.
      </p>

      {/* Sección 12 */}
      <h2 className="text-xl font-bold text-[#03296A] mt-8 mb-3">12. TERMINACIÓN</h2>
      <p className="mb-4">
        Cualquiera de las partes puede terminar la relación de servicios en cualquier momento, con o
        sin causa, proporcionando notificación por escrito. Si usted termina antes de que se completen
        los servicios, sigue siendo responsable por las tarifas por el trabajo realizado hasta la fecha
        de terminación. Si nosotros terminamos, devolveremos sus documentos prontamente y, cuando sea
        apropiado, reembolsaremos cualquier tarifa pagada por adelantado por trabajo aún no realizado.
      </p>

      {/* Sección 13 */}
      <h2 className="text-xl font-bold text-[#03296A] mt-8 mb-3">
        13. LEY APLICABLE Y DISPUTAS
      </h2>
      <p className="mb-4">
        Estos Términos se rigen por las leyes del Estado de Florida. Cualquier disputa que surja de o
        esté relacionada con estos Términos o nuestros servicios se resolverá en los tribunales
        estatales o federales ubicados en el Condado de Broward, Florida, y usted consiente la
        jurisdicción exclusiva de esos tribunales.
      </p>
      <p className="mb-4">
        Antes de presentar cualquier demanda, usted se compromete a intentar primero resolver
        cualquier disputa contactándonos por escrito y proporcionándonos una oportunidad razonable para
        atender su preocupación.
      </p>

      {/* Sección 14 */}
      <h2 className="text-xl font-bold text-[#03296A] mt-8 mb-3">
        14. CAMBIOS A ESTOS TÉRMINOS
      </h2>
      <p className="mb-4">
        Podemos actualizar estos Términos de vez en cuando. La fecha de &quot;Última
        actualización&quot; en la parte superior de estos Términos indica cuándo fueron cambiados más
        recientemente. Los cambios materiales serán publicados en nuestro sitio web. Su uso continuado
        de nuestros servicios después de publicados los cambios constituye aceptación de los Términos
        actualizados.
      </p>

      {/* Sección 15 */}
      <h2 className="text-xl font-bold text-[#03296A] mt-8 mb-3">15. DIVISIBILIDAD</h2>
      <p className="mb-4">
        Si cualquier disposición de estos Términos se determina inaplicable, las disposiciones
        restantes permanecen en vigor.
      </p>

      {/* Sección 16 */}
      <h2 className="text-xl font-bold text-[#03296A] mt-8 mb-3">16. ACUERDO COMPLETO</h2>
      <p className="mb-4">
        Estos Términos, junto con nuestra Política de Privacidad y cualquier carta de contratación o
        acuerdo por escrito que proporcionemos para servicios específicos, constituyen el acuerdo
        completo entre usted y HispanUSA con respecto a nuestros servicios y reemplazan cualquier
        entendimiento previo oral o por escrito.
      </p>

      {/* Sección 17 */}
      <h2 className="text-xl font-bold text-[#03296A] mt-8 mb-3">17. CONTÁCTENOS</h2>
      <p className="mb-4">Para preguntas sobre estos Términos, contáctenos en:</p>
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

export default function TermsAndConditionsPage() {
  return (
    <LegalPageLayout
      englishContent={<EnglishContent />}
      spanishContent={<SpanishContent />}
    />
  );
}
