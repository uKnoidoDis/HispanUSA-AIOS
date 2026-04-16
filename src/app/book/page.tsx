'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Check, Phone, Mail, User, Clock, Calendar, FileText, Briefcase } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type Lang = 'en' | 'es';
type Step = 'language' | 'type' | 'date' | 'time' | 'contact' | 'submitted';
type ApptType = 'personal_tax' | 'corporate_tax' | 'professional_services';
type SubType =
  | 'divorce'
  | 'immigration_consulting'
  | 'general_consulting'
  | 'bankruptcy'
  | 'offer_in_compromise'
  | 'other';

interface BookingState {
  language:         Lang;
  appointmentType:  ApptType | null;
  serviceSubtype:   SubType | null;
  date:             string | null;   // YYYY-MM-DD
  time:             string | null;   // HH:MM
  name:             string;
  phone:            string;
  email:            string;
}

// ─── Translations ─────────────────────────────────────────────────────────────

const copy = {
  en: {
    header:          'HispanUSA',
    subtitle:        'Accounting & Tax Services',
    langPrompt:      'Select your preferred language',
    english:         'English',
    spanish:         'Español',
    stepType:        'What type of appointment do you need?',
    stepDate:        'Select a date',
    stepTime:        'Select a time',
    stepContact:     'Your contact information',
    stepSubmitted:   'Request Submitted',
    back:            'Back',
    next:            'Continue',
    submit:          'Request Appointment',
    submitting:      'Submitting…',
    noSlotsDate:     'No availability on this date',
    noSlotsMonth:    'No availability this month. Try a different month.',
    loadingDates:    'Loading available dates…',
    loadingTimes:    'Loading available times…',
    noTimesAvail:    'No times available for this date.',
    nameLabel:       'Full Name',
    namePlaceholder: 'Maria García',
    phoneLabel:      'Phone Number',
    phonePlaceholder: '(555) 000-0000',
    emailLabel:      'Email Address (optional)',
    emailPlaceholder: 'maria@example.com',
    emailNote:       "We'll send your confirmation here.",
    requiredError:   'This field is required',
    phoneError:      'Enter a valid US phone number',
    emailError:      'Enter a valid email address',
    successTitle:    'Your request has been submitted!',
    successBody:     "You'll receive a confirmation once your appointment is approved. We'll contact you at the number you provided.",
    successCall:     'Questions? Call us at',
    summaryTitle:    'Appointment Summary',
    types: {
      personal_tax:          'Taxes — Personal',
      corporate_tax:         'Taxes — Corporate',
      professional_services: 'Professional Services',
    },
    typeDescs: {
      personal_tax:          'Individual & family tax returns',
      corporate_tax:         'Business & corporate filings',
      professional_services: 'Legal, immigration & consulting',
    },
    typeDurations: {
      personal_tax:          '30 min',
      corporate_tax:         '60 min',
      professional_services: '30 min',
    },
    subtypeLabel: 'Select service type',
    subtypes: {
      divorce:                'Divorce',
      immigration_consulting: 'Immigration Consulting',
      general_consulting:     'General Consulting',
      bankruptcy:             'Bankruptcy',
      offer_in_compromise:    'Offer in Compromise',
      other:                  'Other',
    },
    months: ['January','February','March','April','May','June','July','August','September','October','November','December'],
    days:   ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
    today:  'Today',
    stepLabels: ['Language','Type','Date','Time','Contact','Done'],
  },
  es: {
    header:          'HispanUSA',
    subtitle:        'Contabilidad y Servicios de Impuestos',
    langPrompt:      'Seleccione su idioma preferido',
    english:         'English',
    spanish:         'Español',
    stepType:        '¿Qué tipo de cita necesita?',
    stepDate:        'Seleccione una fecha',
    stepTime:        'Seleccione un horario',
    stepContact:     'Su información de contacto',
    stepSubmitted:   'Solicitud Enviada',
    back:            'Atrás',
    next:            'Continuar',
    submit:          'Solicitar Cita',
    submitting:      'Enviando…',
    noSlotsDate:     'Sin disponibilidad en esta fecha',
    noSlotsMonth:    'Sin disponibilidad este mes. Intente otro mes.',
    loadingDates:    'Cargando fechas disponibles…',
    loadingTimes:    'Cargando horarios disponibles…',
    noTimesAvail:    'No hay horarios disponibles para esta fecha.',
    nameLabel:       'Nombre Completo',
    namePlaceholder: 'María García',
    phoneLabel:      'Número de Teléfono',
    phonePlaceholder: '(555) 000-0000',
    emailLabel:      'Correo Electrónico (opcional)',
    emailPlaceholder: 'maria@ejemplo.com',
    emailNote:       'Le enviaremos la confirmación aquí.',
    requiredError:   'Este campo es requerido',
    phoneError:      'Ingrese un número de teléfono de EE.UU. válido',
    emailError:      'Ingrese un correo electrónico válido',
    successTitle:    '¡Su solicitud ha sido enviada!',
    successBody:     'Recibirá una confirmación una vez que su cita sea aprobada. Nos comunicaremos con usted al número proporcionado.',
    successCall:     '¿Preguntas? Llámenos al',
    summaryTitle:    'Resumen de la Cita',
    types: {
      personal_tax:          'Impuestos — Personal',
      corporate_tax:         'Impuestos — Corporativo',
      professional_services: 'Servicios Profesionales',
    },
    typeDescs: {
      personal_tax:          'Declaraciones individuales y familiares',
      corporate_tax:         'Declaraciones empresariales y corporativas',
      professional_services: 'Legal, inmigración y consultoría',
    },
    typeDurations: {
      personal_tax:          '30 min',
      corporate_tax:         '60 min',
      professional_services: '30 min',
    },
    subtypeLabel: 'Seleccione el tipo de servicio',
    subtypes: {
      divorce:                'Divorcio',
      immigration_consulting: 'Consultoría de Inmigración',
      general_consulting:     'Consultoría General',
      bankruptcy:             'Bancarrota',
      offer_in_compromise:    'Oferta de Compromiso (OIC)',
      other:                  'Otro',
    },
    months: ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'],
    days:   ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'],
    today:  'Hoy',
    stepLabels: ['Idioma','Tipo','Fecha','Horario','Contacto','Listo'],
  },
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime12(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const period = h < 12 ? 'AM' : 'PM';
  const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${displayH}:${String(m).padStart(2, '0')} ${period}`;
}

function formatDateDisplay(dateStr: string, lang: Lang): string {
  const d = new Date(dateStr + 'T12:00:00');
  const month = copy[lang].months[d.getMonth()];
  const day   = d.getDate();
  const year  = d.getFullYear();
  return lang === 'es' ? `${day} de ${month}, ${year}` : `${month} ${day}, ${year}`;
}

function isValidUSPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  return digits.length === 10 || (digits.length === 11 && digits[0] === '1');
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

const STEP_ORDER: Step[] = ['language', 'type', 'date', 'time', 'contact', 'submitted'];
const STEP_PROGRESS: Record<Step, number> = {
  language:  0,
  type:      1,
  date:      2,
  time:      3,
  contact:   4,
  submitted: 5,
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BookPage() {
  const [step, setStep] = useState<Step>('language');
  const [booking, setBooking] = useState<BookingState>({
    language:        'es',
    appointmentType: null,
    serviceSubtype:  null,
    date:            null,
    time:            null,
    name:            '',
    phone:           '',
    email:           '',
  });
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const t = copy[booking.language];

  function goBack() {
    const idx = STEP_ORDER.indexOf(step);
    if (idx > 0) setStep(STEP_ORDER[idx - 1]);
  }

  // ── Step: Language ────────────────────────────────────────────────────────
  function selectLanguage(lang: Lang) {
    setBooking(b => ({ ...b, language: lang }));
    setStep('type');
  }

  // ── Step: Type ────────────────────────────────────────────────────────────
  function selectType(type: ApptType) {
    setBooking(b => ({ ...b, appointmentType: type, serviceSubtype: null, date: null, time: null }));
    if (type !== 'professional_services') setStep('date');
  }

  function confirmType() {
    if (!booking.appointmentType) return;
    if (booking.appointmentType === 'professional_services' && !booking.serviceSubtype) {
      setErrors(e => ({ ...e, subtype: t.requiredError }));
      return;
    }
    setErrors({});
    setStep('date');
  }

  // ── Step: Contact ─────────────────────────────────────────────────────────
  function validateContact(): boolean {
    const errs: Record<string, string> = {};
    if (!booking.name.trim()) errs.name = t.requiredError;
    if (!booking.phone.trim()) {
      errs.phone = t.requiredError;
    } else if (!isValidUSPhone(booking.phone)) {
      errs.phone = t.phoneError;
    }
    if (booking.email && !isValidEmail(booking.email)) {
      errs.email = t.emailError;
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit() {
    if (!validateContact()) return;
    if (!booking.appointmentType || !booking.date || !booking.time) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch('/api/appointments/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_name:      booking.name.trim(),
          client_phone:     booking.phone,
          client_email:     booking.email || null,
          appointment_type: booking.appointmentType,
          service_subtype:  booking.serviceSubtype || null,
          date:             booking.date,
          start_time:       booking.time,
          language:         booking.language,
        }),
      });

      if (!res.ok) {
        const body = await res.json();
        setSubmitError(
          typeof body.error === 'string'
            ? body.error
            : booking.language === 'es'
              ? 'Ocurrió un error. Por favor intente de nuevo o llame al 954-934-0194.'
              : 'Something went wrong. Please try again or call 954-934-0194.'
        );
        return;
      }

      setStep('submitted');
    } catch {
      setSubmitError(
        booking.language === 'es'
          ? 'Error de conexión. Por favor intente de nuevo.'
          : 'Connection error. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  const showBack = step !== 'language' && step !== 'submitted';
  const currentStepNum = STEP_PROGRESS[step];
  const totalSteps     = 5; // language through contact (submitted is done state)

  return (
    <div className="min-h-screen bg-[#EDF2F8] flex flex-col" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="bg-[#03296A] text-white px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div>
          <Image src="/hispanusa-logo.png" alt="HispanUSA" width={180} height={60} style={{ height: 'auto' }} />
        </div>
        {step !== 'language' && step !== 'submitted' && (
          <button
            onClick={() => setBooking(b => ({ ...b, language: b.language === 'en' ? 'es' : 'en' }))}
            className="text-sm font-medium text-blue-200/70 hover:text-white transition-colors duration-150 px-3 py-1.5 rounded-md hover:bg-white/10"
          >
            {booking.language === 'en' ? 'Español' : 'English'}
          </button>
        )}
      </header>

      {/* ── Progress bar — connected dots with step labels ─────────────────── */}
      {step !== 'language' && step !== 'submitted' && (
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
          <div className="max-w-xl mx-auto">
            <div className="flex items-center">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <React.Fragment key={i}>
                  {/* Dot */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-3 h-3 rounded-full transition-all duration-300 ${
                        i < currentStepNum ? 'bg-[#03296A]' : i === currentStepNum ? 'bg-[#D4932A] ring-4 ring-[#D4932A]/20' : 'bg-gray-300'
                      }`}
                    />
                    <span className={`text-[10px] mt-1.5 font-medium transition-colors duration-300 ${
                      i <= currentStepNum ? 'text-[#03296A]' : 'text-gray-400'
                    }`}>
                      {t.stepLabels[i + 1]}
                    </span>
                  </div>
                  {/* Connector line */}
                  {i < totalSteps - 1 && (
                    <div className={`flex-1 h-[2px] mx-1 transition-all duration-300 ${
                      i < currentStepNum ? 'bg-[#03296A]' : 'bg-gray-200'
                    }`} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Main content ────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col items-center justify-start px-4 py-8">
        <div className="w-full max-w-lg">

          {/* ── STEP: Language ─────────────────────────────────────────────── */}
          {step === 'language' && (
            <div className="text-center">
              <div className="mb-10">
                <Image src="/hispanusa-logo.png" alt="HispanUSA" width={200} height={67} style={{ height: 'auto' }} className="mx-auto mb-4" />
              </div>
              <p className="text-lg font-semibold text-gray-700 mb-6">{t.langPrompt}</p>
              <div className="flex flex-col gap-4">
                <button
                  onClick={() => selectLanguage('en')}
                  className="w-full py-5 px-6 bg-white rounded-xl border-2 border-gray-200 hover:border-[#1B3A5C] hover:bg-[#EDF2F8] transition-all duration-200 text-xl font-bold text-[#03296A] shadow-[0_1px_3px_rgba(0,0,0,0.08)] hover:shadow-md hover:-translate-y-0.5"
                >
                  English
                </button>
                <button
                  onClick={() => selectLanguage('es')}
                  className="w-full py-5 px-6 bg-[#03296A] rounded-xl border-2 border-[#03296A] hover:bg-[#1B3A5C] transition-all duration-200 text-xl font-bold text-white shadow-sm hover:shadow-md hover:-translate-y-0.5"
                >
                  Español
                </button>
              </div>
            </div>
          )}

          {/* ── STEP: Type ─────────────────────────────────────────────────── */}
          {step === 'type' && (
            <div>
              <h2 className="text-xl font-bold text-[#03296A] mb-6">{t.stepType}</h2>
              <div className="flex flex-col gap-3">
                {(['personal_tax', 'corporate_tax', 'professional_services'] as ApptType[]).map(type => (
                  <TypeCard
                    key={type}
                    type={type}
                    selected={booking.appointmentType === type}
                    label={t.types[type]}
                    desc={t.typeDescs[type]}
                    duration={t.typeDurations[type]}
                    onClick={() => selectType(type)}
                  />
                ))}

                {/* Subtype dropdown for professional services */}
                {booking.appointmentType === 'professional_services' && (
                  <div className="mt-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      {t.subtypeLabel}
                    </label>
                    <select
                      value={booking.serviceSubtype ?? ''}
                      onChange={e => {
                        setBooking(b => ({ ...b, serviceSubtype: (e.target.value as SubType) || null }));
                        setErrors(err => ({ ...err, subtype: undefined }));
                      }}
                      className={`w-full px-4 py-3 rounded-xl border-2 bg-white text-gray-800 font-medium outline-none transition-colors ${
                        errors.subtype ? 'border-red-400' : 'border-gray-200 focus:border-[#1B3A5C]'
                      }`}
                    >
                      <option value="">—</option>
                      {(Object.keys(t.subtypes) as SubType[]).map(st => (
                        <option key={st} value={st}>{t.subtypes[st]}</option>
                      ))}
                    </select>
                    {errors.subtype && (
                      <p className="text-red-500 text-sm mt-1">{errors.subtype}</p>
                    )}
                    <div className="mt-4">
                      <button
                        onClick={confirmType}
                        className="w-full py-4 bg-[#1B3A5C] text-white font-bold rounded-xl hover:bg-[#244B75] transition-colors flex items-center justify-center gap-2"
                      >
                        {t.next} <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── STEP: Date ─────────────────────────────────────────────────── */}
          {step === 'date' && booking.appointmentType && (
            <DateStep
              lang={booking.language}
              apptType={booking.appointmentType}
              selectedDate={booking.date}
              onSelect={date => {
                setBooking(b => ({ ...b, date, time: null }));
                setStep('time');
              }}
            />
          )}

          {/* ── STEP: Time ─────────────────────────────────────────────────── */}
          {step === 'time' && booking.date && booking.appointmentType && (
            <TimeStep
              date={booking.date}
              apptType={booking.appointmentType}
              selectedTime={booking.time}
              lang={booking.language}
              onSelect={time => {
                setBooking(b => ({ ...b, time }));
                setStep('contact');
              }}
            />
          )}

          {/* ── STEP: Contact ──────────────────────────────────────────────── */}
          {step === 'contact' && (
            <div>
              <h2 className="text-xl font-bold text-[#03296A] mb-6">{t.stepContact}</h2>

              {/* Summary chip */}
              {booking.date && booking.time && booking.appointmentType && (
                <div className="bg-[#EDF2F8] border border-[#1B3A5C]/20 rounded-xl px-4 py-3 mb-6 flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#1B3A5C]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-4 h-4 text-[#1B3A5C]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#1B3A5C] truncate">{t.types[booking.appointmentType]}</p>
                    <p className="text-xs text-gray-500">{formatDateDisplay(booking.date, booking.language)} · {formatTime12(booking.time)}</p>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-4">
                <FormField
                  label={t.nameLabel}
                  icon={<User className="w-4 h-4" />}
                  error={errors.name}
                >
                  <input
                    type="text"
                    placeholder={t.namePlaceholder}
                    value={booking.name}
                    onChange={e => { setBooking(b => ({ ...b, name: e.target.value })); setErrors(er => ({ ...er, name: undefined })); }}
                    autoComplete="name"
                    className={`w-full px-4 py-3 rounded-xl border-2 bg-white text-gray-800 outline-none transition-colors placeholder:text-gray-400 ${
                      errors.name ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-[#1B3A5C]'
                    }`}
                  />
                </FormField>

                <FormField
                  label={t.phoneLabel}
                  icon={<Phone className="w-4 h-4" />}
                  error={errors.phone}
                >
                  <input
                    type="tel"
                    placeholder={t.phonePlaceholder}
                    value={booking.phone}
                    onChange={e => { setBooking(b => ({ ...b, phone: e.target.value })); setErrors(er => ({ ...er, phone: undefined })); }}
                    autoComplete="tel"
                    inputMode="tel"
                    className={`w-full px-4 py-3 rounded-xl border-2 bg-white text-gray-800 outline-none transition-colors placeholder:text-gray-400 ${
                      errors.phone ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-[#1B3A5C]'
                    }`}
                  />
                </FormField>

                <FormField
                  label={t.emailLabel}
                  icon={<Mail className="w-4 h-4" />}
                  error={errors.email}
                  note={t.emailNote}
                >
                  <input
                    type="email"
                    placeholder={t.emailPlaceholder}
                    value={booking.email}
                    onChange={e => { setBooking(b => ({ ...b, email: e.target.value })); setErrors(er => ({ ...er, email: undefined })); }}
                    autoComplete="email"
                    inputMode="email"
                    className={`w-full px-4 py-3 rounded-xl border-2 bg-white text-gray-800 outline-none transition-colors placeholder:text-gray-400 ${
                      errors.email ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-[#1B3A5C]'
                    }`}
                  />
                </FormField>
              </div>

              {submitError && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                  {submitError}
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="mt-6 w-full py-4 bg-[#D4932A] text-white font-bold text-base rounded-xl hover:bg-[#B87D22] disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                {submitting ? t.submitting : t.submit}
                {!submitting && <ChevronRight className="w-5 h-5" />}
              </button>
            </div>
          )}

          {/* ── STEP: Submitted ────────────────────────────────────────────── */}
          {step === 'submitted' && (
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-[#03296A] mb-3">{t.successTitle}</h2>
              <p className="text-gray-600 leading-relaxed mb-8">{t.successBody}</p>

              {/* Summary */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5 text-left space-y-3 shadow-sm mb-8">
                <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">{t.summaryTitle}</p>
                {booking.appointmentType && (
                  <SummaryRow icon={<FileText className="w-4 h-4" />} label={t.types[booking.appointmentType]} />
                )}
                {booking.serviceSubtype && booking.appointmentType === 'professional_services' && (
                  <SummaryRow icon={<Briefcase className="w-4 h-4" />} label={t.subtypes[booking.serviceSubtype]} />
                )}
                {booking.date && (
                  <SummaryRow icon={<Calendar className="w-4 h-4" />} label={formatDateDisplay(booking.date, booking.language)} />
                )}
                {booking.time && (
                  <SummaryRow icon={<Clock className="w-4 h-4" />} label={formatTime12(booking.time)} />
                )}
                {booking.name && (
                  <SummaryRow icon={<User className="w-4 h-4" />} label={booking.name} />
                )}
                {booking.phone && (
                  <SummaryRow icon={<Phone className="w-4 h-4" />} label={booking.phone} />
                )}
              </div>

              <p className="text-sm text-gray-500">
                {t.successCall}{' '}
                <a href="tel:9549340194" className="text-[#1B3A5C] font-semibold hover:underline">
                  (954) 934-0194
                </a>
              </p>
            </div>
          )}

          {/* ── Back button ────────────────────────────────────────────────── */}
          {showBack && step !== 'contact' && (
            <button
              onClick={goBack}
              className="mt-6 flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#1B3A5C] transition-colors font-medium"
            >
              <ChevronLeft className="w-4 h-4" />
              {t.back}
            </button>
          )}
          {step === 'contact' && (
            <button
              onClick={goBack}
              className="mt-4 flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#1B3A5C] transition-colors font-medium"
            >
              <ChevronLeft className="w-4 h-4" />
              {t.back}
            </button>
          )}
        </div>
      </main>

      {/* ── Footer ────────────────────────────────────────────────────────────── */}
      <footer className="bg-white border-t border-gray-200 px-6 py-4 text-center flex-shrink-0">
        <p className="text-xs text-gray-400">
          HispanUSA Accounting &amp; Tax Services · (954) 934-0194
        </p>
        <div className="flex flex-col items-center mt-2">
          <Image src="/dhs-logo.png" alt="Dark Horse Systems" width={130} height={43} style={{ height: 'auto' }} />
          <p className="text-[10px] text-[#03296A]/40 font-medium mt-0.5">Powered by Dark Horse Systems</p>
        </div>
      </footer>
    </div>
  );
}

// ─── TypeCard ─────────────────────────────────────────────────────────────────

function TypeCard({
  type, selected, label, desc, duration, onClick,
}: {
  type: ApptType;
  selected: boolean;
  label: string;
  desc: string;
  duration: string;
  onClick: () => void;
}) {
  const icons: Record<ApptType, React.ReactNode> = {
    personal_tax:          <User className="w-6 h-6" />,
    corporate_tax:         <Briefcase className="w-6 h-6" />,
    professional_services: <FileText className="w-6 h-6" />,
  };

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl border-2 text-left transition-all duration-200 ${
        selected
          ? 'border-[#03296A] bg-[#EDF2F8] shadow-sm'
          : 'border-gray-200 bg-white hover:border-[#1B3A5C]/40 hover:shadow-md hover:-translate-y-[2px]'
      }`}
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
        selected ? 'bg-[#03296A] text-white' : 'bg-gray-100 text-gray-600'
      }`}>
        {icons[type]}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`font-bold text-base ${selected ? 'text-[#03296A]' : 'text-gray-800'}`}>{label}</p>
        <p className="text-sm text-gray-500 truncate">{desc}</p>
      </div>
      <div className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${
        selected ? 'bg-[#03296A]/10 text-[#03296A]' : 'bg-gray-100 text-gray-500'
      }`}>
        <Clock className="w-3 h-3" />
        {duration}
      </div>
    </button>
  );
}

// ─── DateStep ─────────────────────────────────────────────────────────────────

function DateStep({
  lang, apptType, selectedDate, onSelect,
}: {
  lang: Lang;
  apptType: ApptType;
  selectedDate: string | null;
  onSelect: (date: string) => void;
}) {
  const t = copy[lang];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [viewYear,  setViewYear ] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [available, setAvailable] = useState<Set<string>>(new Set());
  const [loading,   setLoading  ] = useState(true);

  const fetchAvailable = useCallback(async (year: number, month: number) => {
    setLoading(true);
    try {
      const start = new Date(year, month, 1).toISOString().slice(0, 10);
      const end   = new Date(year, month + 2, 0).toISOString().slice(0, 10);
      const res = await fetch(`/api/appointments/available-dates?type=${apptType}`);
      if (!res.ok) throw new Error();
      const dates: string[] = await res.json();
      // Filter to the current view month + next
      setAvailable(new Set(dates.filter(d => d >= start && d <= end)));
    } catch {
      setAvailable(new Set());
    } finally {
      setLoading(false);
    }
  }, [apptType]);

  useEffect(() => { fetchAvailable(viewYear, viewMonth); }, [fetchAvailable, viewYear, viewMonth]);

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  }

  // Build calendar grid (Mon-based)
  const firstDay = new Date(viewYear, viewMonth, 1);
  const lastDay  = new Date(viewYear, viewMonth + 1, 0);
  const startPad = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
  const totalCells = Math.ceil((startPad + lastDay.getDate()) / 7) * 7;
  const cells: (Date | null)[] = Array.from({ length: totalCells }, (_, i) => {
    const dayNum = i - startPad + 1;
    if (dayNum < 1 || dayNum > lastDay.getDate()) return null;
    return new Date(viewYear, viewMonth, dayNum);
  });

  const isPastMonth = viewYear < today.getFullYear() ||
    (viewYear === today.getFullYear() && viewMonth < today.getMonth());

  return (
    <div>
      <h2 className="text-xl font-bold text-[#03296A] mb-5">{t.stepDate}</h2>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Month nav */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <button
            onClick={prevMonth}
            disabled={isPastMonth}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="font-bold text-[#1B3A5C] text-base">
            {t.months[viewMonth]} {viewYear}
          </span>
          <button
            onClick={nextMonth}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-gray-100">
          {t.days.map(d => (
            <div key={d} className="py-2 text-center text-xs font-semibold text-gray-400">{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        {loading ? (
          <div className="py-12 text-center text-sm text-gray-400">{t.loadingDates}</div>
        ) : (
          <div className="grid grid-cols-7 p-2 gap-1">
            {cells.map((date, i) => {
              if (!date) return <div key={`empty-${i}`} />;
              const dateStr = date.toISOString().slice(0, 10);
              const isPast  = date < today;
              const isAvail = available.has(dateStr);
              const isSel   = dateStr === selectedDate;
              const isToday = dateStr === today.toISOString().slice(0, 10);

              return (
                <button
                  key={dateStr}
                  disabled={isPast || !isAvail}
                  onClick={() => onSelect(dateStr)}
                  className={`
                    aspect-square flex flex-col items-center justify-center rounded-lg text-sm font-medium transition-all duration-150 relative
                    ${isSel      ? 'bg-[#03296A] text-white font-bold shadow-sm' : ''}
                    ${!isSel && isAvail && !isPast ? 'text-gray-800 hover:bg-[#EDF2F8] hover:text-[#03296A] cursor-pointer' : ''}
                    ${isPast || !isAvail ? 'text-gray-300 cursor-not-allowed' : ''}
                  `}
                >
                  {date.getDate()}
                  {isToday && !isSel && (
                    <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#D4932A]" />
                  )}
                  {isAvail && !isSel && !isPast && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {!loading && available.size === 0 && (
        <p className="mt-4 text-center text-sm text-gray-500">{t.noSlotsMonth}</p>
      )}
    </div>
  );
}

// ─── TimeStep ─────────────────────────────────────────────────────────────────

function TimeStep({
  date, apptType, selectedTime, lang, onSelect,
}: {
  date: string;
  apptType: ApptType;
  selectedTime: string | null;
  lang: Lang;
  onSelect: (time: string) => void;
}) {
  const t = copy[lang];
  const [times,   setTimes  ] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/appointments/available-times?date=${date}&type=${apptType}`)
      .then(r => r.ok ? r.json() : [])
      .then((data: string[]) => setTimes(data))
      .catch(() => setTimes([]))
      .finally(() => setLoading(false));
  }, [date, apptType]);

  const displayDate = formatDateDisplay(date, lang);

  return (
    <div>
      <h2 className="text-xl font-bold text-[#03296A] mb-1">{t.stepTime}</h2>
      <p className="text-sm text-gray-500 mb-5">{displayDate}</p>

      {loading ? (
        <div className="py-12 text-center text-sm text-gray-400">{t.loadingTimes}</div>
      ) : times.length === 0 ? (
        <div className="py-12 text-center">
          <Clock className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">{t.noTimesAvail}</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {times.map(time => {
            const isSel = time === selectedTime;
            return (
              <button
                key={time}
                onClick={() => onSelect(time)}
                className={`py-3.5 px-2 rounded-xl border-2 text-sm font-semibold transition-all duration-150 ${
                  isSel
                    ? 'bg-[#1B3A5C] border-[#1B3A5C] text-white shadow-sm'
                    : 'bg-white border-gray-200 text-gray-700 hover:border-[#1B3A5C]/50 hover:bg-[#EDF2F8]'
                }`}
              >
                {formatTime12(time)}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── FormField ────────────────────────────────────────────────────────────────

function FormField({
  label, icon, error, note, children,
}: {
  label: string;
  icon?: React.ReactNode;
  error?: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1.5">
        {icon && <span className="text-gray-400">{icon}</span>}
        {label}
      </label>
      {children}
      {note && !error && <p className="text-xs text-gray-400 mt-1">{note}</p>}
      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
    </div>
  );
}

// ─── SummaryRow ───────────────────────────────────────────────────────────────

function SummaryRow({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[#1B3A5C]/50 flex-shrink-0">{icon}</span>
      <span className="text-sm text-gray-700 font-medium">{label}</span>
    </div>
  );
}
