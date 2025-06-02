// src/pages/Contact.tsx

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { API_BASE } from '../api/config';
import Footer from '../components/Footer';
import '../styles/contact.css';

type ContactType = 'error' | 'suggestion' | 'general';
type Priority = 'low' | 'medium' | 'high';

const MAX_FILES = 3;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

const ContactPage: React.FC = () => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<ContactType>('general');
  const [priority, setPriority] = useState<Priority>('low');
  const [files, setFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [ticketId, setTicketId] = useState<string | null>(null);

  useEffect(() => {
    document.title = `${t('contact.submit')} | NewsBalance`;
  }, [t]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = t('contact.errors.nameRequired');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errs.email = t('contact.errors.emailInvalid');
    if (!subject.trim()) errs.subject = t('contact.errors.subjectRequired');
    if (!message.trim()) errs.message = t('contact.errors.messageRequired');

    files.forEach((f, i) => {
      if (!ALLOWED_TYPES.includes(f.type)) {
        errs[`file${i}`] = t('contact.errors.fileTypeInvalid');
      } else if (f.size > MAX_FILE_SIZE) {
        errs[`file${i}`] = t('contact.errors.fileTooLarge');
      }
    });
    return errs;
  };

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files ? Array.from(e.target.files) : [];
    setFiles(selected.slice(0, MAX_FILES));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setSubmitting(true);

    const formData = new FormData();
    formData.append('name', name);
    formData.append('email', email);
    formData.append('subject', subject);
    formData.append('message', message);
    formData.append('type', type);
    formData.append('priority', priority);
    files.forEach((file, idx) => {
      formData.append(`file${idx}`, file);
    });

    try {
      const resp = await axios.post<{ ticketId: string }>(
        `${API_BASE}/contact`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      setTicketId(resp.data.ticketId);
    } catch {
      setErrors({ submit: t('contact.errors.submitFailed') });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="contact-page">
      <main
        className="contact-container"
        role="main"
        aria-labelledby="contact-title"
      >
        <h1 id="contact-title" className="contact-title">
          {t('contact.submit')}
        </h1>

        {ticketId ? (
          <div className="contact-success" role="alert">
            {t('contact.success', { ticketId })}
          </div>
        ) : (
          <form className="contact-form" onSubmit={handleSubmit} noValidate>
            {/* 이름 */}
            <div className="form-group">
              <label htmlFor="name">{t('contact.name')} *</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                aria-invalid={!!errors.name}
              />
              {errors.name && <span className="error">{errors.name}</span>}
            </div>

            {/* 이메일 */}
            <div className="form-group">
              <label htmlFor="email">{t('contact.email')} *</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                aria-invalid={!!errors.email}
              />
              {errors.email && <span className="error">{errors.email}</span>}
            </div>

            {/* 제보 종류 */}
            <div className="form-group">
              <label htmlFor="type">{t('contact.type')} *</label>
              <select
                id="type"
                value={type}
                onChange={e => setType(e.target.value as ContactType)}
              >
                <option value="error">{t('contact.typeError')}</option>
                <option value="suggestion">{t('contact.typeSuggestion')}</option>
                <option value="general">{t('contact.typeGeneral')}</option>
              </select>
            </div>

            {/* 우선순위 */}
            <fieldset className="form-group">
              <legend id="priority-label">{t('contact.priority')} *</legend>
              <div role="radiogroup" aria-labelledby="priority-label" className="radio-group">
                {(['low', 'medium', 'high'] as Priority[]).map(p => (
                  <label key={p}>
                    <input
                      type="radio"
                      name="priority"
                      value={p}
                      checked={priority === p}
                      onChange={() => setPriority(p)}
                    />
                    <span>{t(`contact.priority${p.charAt(0).toUpperCase() + p.slice(1)}`)}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            {/* 제목 */}
            <div className="form-group">
              <label htmlFor="subject">{t('contact.subject')} *</label>
              <input
                id="subject"
                type="text"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                aria-invalid={!!errors.subject}
              />
              {errors.subject && <span className="error">{errors.subject}</span>}
            </div>

            {/* 내용 */}
            <div className="form-group">
              <label htmlFor="message">{t('contact.message')} *</label>
              <textarea
                id="message"
                rows={6}
                value={message}
                onChange={e => setMessage(e.target.value)}
                aria-invalid={!!errors.message}
              />
              {errors.message && <span className="error">{errors.message}</span>}
            </div>

            {/* 첨부파일 */}
            <div className="form-group">
              <label htmlFor="files">{t('contact.attachments')}</label>
              <input
                id="files"
                type="file"
                multiple
                onChange={handleFilesChange}
                accept={ALLOWED_TYPES.join(',')}
              />
              {files.map((f, i) => (
                <div key={i} className="file-info">
                  {f.name} ({(f.size / 1024 / 1024).toFixed(2)}MB)
                  {errors[`file${i}`] && <span className="error">{errors[`file${i}`]}</span>}
                </div>
              ))}
              <small>{t('contact.attachmentsInfo', { maxFiles: MAX_FILES })}</small>
            </div>

            {errors.submit && <div className="error submit-error">{errors.submit}</div>}

            <button type="submit" disabled={submitting}>
              {submitting ? t('contact.sending') : t('contact.submit')}
            </button>
          </form>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default ContactPage;
