import { Metadata } from 'next';
import LegalPageLayout from '@/components/legal/LegalPageLayout';

export const metadata: Metadata = {
  title: 'SMS Communications | HispanUSA Accounting & Tax Services',
  description:
    'How HispanUSA Accounting & Tax Services collects consent for SMS text messages: the opt-in process, message types, frequency, opt-out, and help.',
};

// Placeholder for the consent-step screenshots. Drop-in targets (PNGs saved
// manually to public/ — binary files are added by hand, not generated):
//   public/sms-consent-step-en.png  (English consent step at book.hispanusa.com/book)
//   public/sms-consent-step-es.png  (Spanish consent step at book.hispanusa.com/book)
// Once the files exist, replace each <ScreenshotSlot .../> with:
//   <Image src="/sms-consent-step-en.png" alt="Booking form consent step (English)"
//          width={640} height={480} className="my-6 rounded-xl border border-gray-200 w-full h-auto" />
// (import Image from 'next/image' at that point)
function ScreenshotSlot({ label }: { label: string }) {
  return (
    <div className="my-6 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-10 text-center text-sm text-gray-400">
      {label}
    </div>
  );
}

function ConsentQuote({ checkbox, body }: { checkbox: string; body: React.ReactNode }) {
  return (
    <blockquote className="my-4 rounded-xl border-2 border-gray-200 bg-gray-50 p-4">
      <p className="font-semibold text-gray-800 mb-2">&#9744; {checkbox}</p>
      <p className="text-sm text-gray-700 leading-relaxed">{body}</p>
    </blockquote>
  );
}

function EnglishContent() {
  return (
    <>
      <h1 className="text-3xl font-bold text-[#03296A] mb-2">SMS / TEXT MESSAGE COMMUNICATIONS</h1>
      <p className="text-sm text-gray-500 mb-8">Effective Date: July 11, 2026</p>

      <p className="mb-4">
        This page describes how HispanUSA Accounting &amp; Tax Services collects consent for SMS text
        messages and what you can expect if you opt in.
      </p>

      <h2 className="text-xl font-bold text-[#03296A] mt-8 mb-3">How we collect consent</h2>
      <p className="mb-4">
        When you book an appointment online at <strong>book.hispanusa.com/book</strong>, the contact
        step includes an optional, <strong>unchecked-by-default</strong> checkbox. You can complete
        your booking without checking it &mdash; SMS is never a condition of service. The checkbox and
        disclosure read, exactly as shown in the booking flow:
      </p>
      <ConsentQuote
        checkbox="Yes, send me text message reminders about my appointment."
        body={
          <>
            By checking this box, you agree to receive appointment-related text messages from
            HispanUSA Accounting &amp; Tax Services at the phone number provided. Message frequency
            varies, up to 5 messages per appointment cycle. Message and data rates may apply. Reply
            STOP to unsubscribe at any time. Reply HELP for help. See our{' '}
            <a href="/privacy-policy" className="text-[#03296A] underline">Privacy Policy</a> and{' '}
            <a href="/terms-and-conditions" className="text-[#03296A] underline">Terms and Conditions</a>.
          </>
        }
      />
      <ScreenshotSlot label="Screenshot pending — booking-flow consent step (English)" />
      <p className="mb-4">
        When you check the box, we record your consent with a timestamp, IP address, and the version
        of the disclosure text you agreed to.
      </p>

      <h2 className="text-xl font-bold text-[#03296A] mt-8 mb-3">What we send</h2>
      <p className="mb-4">
        Appointment-related messages only: appointment confirmations, appointment reminders before
        your scheduled appointment, and document checklist messages telling you what to bring or send
        for your appointment. This may include a notice if your requested time is unavailable or if
        your appointment is changed or cancelled. See Section 5 of our{' '}
        <a href="/privacy-policy" className="text-[#03296A] underline">Privacy Policy</a> for full
        details.
      </p>

      <h2 className="text-xl font-bold text-[#03296A] mt-8 mb-3">Message frequency</h2>
      <p className="mb-4">Message frequency varies, up to 5 messages per appointment cycle.</p>

      <h2 className="text-xl font-bold text-[#03296A] mt-8 mb-3">Message and data rates</h2>
      <p className="mb-4">
        Standard message and data rates may apply based on your mobile carrier and plan. HispanUSA
        does not charge for SMS messages, but your carrier may.
      </p>

      <h2 className="text-xl font-bold text-[#03296A] mt-8 mb-3">How to opt out</h2>
      <p className="mb-4">
        Reply <strong>STOP</strong> to any text message from us at any time. You will receive a
        confirmation message and no further SMS from us. You will continue to receive non-SMS
        communications (email, phone, mail) about your services unless you also opt out of those
        channels.
      </p>

      <h2 className="text-xl font-bold text-[#03296A] mt-8 mb-3">How to get help</h2>
      <p className="mb-4">
        Reply <strong>HELP</strong> to any text message for assistance with messaging. For questions
        about your appointment or our services, call our office at 954-934-0194 or email
        info@hispanusa.com.
      </p>

      <h2 className="text-xl font-bold text-[#03296A] mt-8 mb-3">Your information</h2>
      <p className="mb-4">
        Your mobile phone number and your SMS opt-in are never shared with third parties or
        affiliates for marketing purposes.
      </p>

      <p className="mb-4">
        Full details:{' '}
        <a href="/privacy-policy" className="text-[#03296A] underline">Privacy Policy</a> &middot;{' '}
        <a href="/terms-and-conditions" className="text-[#03296A] underline">Terms and Conditions</a>
      </p>
    </>
  );
}

function SpanishContent() {
  return (
    <>
      <h1 className="text-3xl font-bold text-[#03296A] mb-2">
        COMUNICACIONES POR MENSAJE DE TEXTO (SMS)
      </h1>
      <p className="text-sm text-gray-500 mb-8">Fecha de vigencia: 11 de julio de 2026</p>

      <p className="mb-4">
        Esta página describe cómo HispanUSA Accounting &amp; Tax Services obtiene el consentimiento
        para mensajes de texto (SMS) y qué puede esperar si usted acepta recibirlos.
      </p>

      <h2 className="text-xl font-bold text-[#03296A] mt-8 mb-3">Cómo obtenemos su consentimiento</h2>
      <p className="mb-4">
        Al reservar una cita en línea en <strong>book.hispanusa.com/book</strong>, el paso de contacto
        incluye una casilla opcional, <strong>desmarcada por defecto</strong>. Usted puede completar
        su reserva sin marcarla &mdash; recibir SMS nunca es una condición del servicio. La casilla y
        la divulgación dicen, exactamente como aparecen en el proceso de reserva:
      </p>
      <ConsentQuote
        checkbox="Sí, envíenme recordatorios de mi cita por mensaje de texto."
        body={
          <>
            Al marcar esta casilla, usted acepta recibir mensajes de texto relacionados con su cita
            de HispanUSA Accounting &amp; Tax Services al número de teléfono proporcionado. La
            frecuencia de los mensajes varía, hasta 5 mensajes por ciclo de cita. Pueden aplicarse
            tarifas de mensajes y datos. Responda STOP para cancelar la suscripción en cualquier
            momento. Responda HELP para obtener ayuda. Consulte nuestra{' '}
            <a href="/privacy-policy" className="text-[#03296A] underline">Política de Privacidad</a>{' '}
            y nuestros{' '}
            <a href="/terms-and-conditions" className="text-[#03296A] underline">Términos y Condiciones</a>.
          </>
        }
      />
      <ScreenshotSlot label="Captura pendiente — paso de consentimiento del proceso de reserva (español)" />
      <p className="mb-4">
        Cuando usted marca la casilla, registramos su consentimiento con fecha y hora, dirección IP y
        la versión del texto de divulgación que aceptó.
      </p>

      <h2 className="text-xl font-bold text-[#03296A] mt-8 mb-3">Qué enviamos</h2>
      <p className="mb-4">
        Únicamente mensajes relacionados con su cita: confirmaciones de citas, recordatorios antes de
        su cita programada y mensajes con listas de documentos indicándole qué traer o enviar para su
        cita. Esto puede incluir un aviso si el horario que solicitó no está disponible o si su cita
        es modificada o cancelada. Consulte la Sección 5 de nuestra{' '}
        <a href="/privacy-policy" className="text-[#03296A] underline">Política de Privacidad</a>{' '}
        para más detalles.
      </p>

      <h2 className="text-xl font-bold text-[#03296A] mt-8 mb-3">Frecuencia de mensajes</h2>
      <p className="mb-4">
        La frecuencia de los mensajes varía, hasta 5 mensajes por ciclo de cita.
      </p>

      <h2 className="text-xl font-bold text-[#03296A] mt-8 mb-3">Tarifas de mensajes y datos</h2>
      <p className="mb-4">
        Pueden aplicarse las tarifas estándar de mensajes y datos según su operador de telefonía
        móvil y su plan. HispanUSA no cobra por los mensajes SMS, pero su operador podría hacerlo.
      </p>

      <h2 className="text-xl font-bold text-[#03296A] mt-8 mb-3">Cómo cancelar la suscripción</h2>
      <p className="mb-4">
        Responda <strong>STOP</strong> a cualquier mensaje de texto nuestro en cualquier momento.
        Recibirá un mensaje de confirmación y no recibirá más mensajes SMS de nosotros. Continuará
        recibiendo comunicaciones no-SMS (correo electrónico, teléfono, correo postal) sobre sus
        servicios a menos que también cancele esos canales.
      </p>

      <h2 className="text-xl font-bold text-[#03296A] mt-8 mb-3">Cómo obtener ayuda</h2>
      <p className="mb-4">
        Responda <strong>HELP</strong> (AYUDA) a cualquier mensaje de texto para obtener asistencia
        con los mensajes. Para preguntas sobre su cita o nuestros servicios, llame a nuestra oficina
        al 954-934-0194 o envíenos un correo electrónico a info@hispanusa.com.
      </p>

      <h2 className="text-xl font-bold text-[#03296A] mt-8 mb-3">Su información</h2>
      <p className="mb-4">
        Su número de teléfono móvil y su consentimiento SMS nunca se comparten con terceros o
        afiliados con fines de mercadeo.
      </p>

      <p className="mb-4">
        Detalles completos:{' '}
        <a href="/privacy-policy" className="text-[#03296A] underline">Política de Privacidad</a>{' '}
        &middot;{' '}
        <a href="/terms-and-conditions" className="text-[#03296A] underline">Términos y Condiciones</a>
      </p>
    </>
  );
}

export default function SmsCommunicationsPage() {
  return (
    <LegalPageLayout
      englishContent={<EnglishContent />}
      spanishContent={<SpanishContent />}
    />
  );
}
