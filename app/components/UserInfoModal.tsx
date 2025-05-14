import React, { useState } from 'react';

interface UserInfoModalProps {
  onSubmit: (info: { fullname: string; email: string; phone?: string }) => void;
  onClose?: () => void;
}

const UserInfoModal = ({ onSubmit, onClose }: UserInfoModalProps) => {
  const [fullname, setFullname] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullname.trim()) {
      setError('Full name is required.');
      return;
    }
    if (!email.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setError('A valid email address is required.');
      return;
    }
    setError('');
    onSubmit({ fullname: fullname.trim(), email: email.trim(), phone: phone.trim() || undefined });
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="notification-overlay">
      <div className="userinfo-modal-card" onClick={e => e.stopPropagation()}>
        <button className="userinfo-close-btn" onClick={handleClose}>
          &times;
        </button>
        <div className="userinfo-modal-header">
          <h2>Welcome!</h2>
          <p className="userinfo-modal-subtitle">Please enter your details to continue</p>
        </div>
        <form className="userinfo-modal-form" onSubmit={handleSubmit} autoComplete="on">
          <div className="userinfo-form-group">
            <label htmlFor="fullname">Full Name <span className="required">*</span></label>
            <input
              id="fullname"
              type="text"
              value={fullname}
              onChange={e => setFullname(e.target.value)}
              required
              autoFocus
              className="userinfo-input"
              placeholder="Your full name"
            />
          </div>
          <div className="userinfo-form-group">
            <label htmlFor="email">Email Address <span className="required">*</span></label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="userinfo-input"
              placeholder="you@email.com"
            />
          </div>
          <div className="userinfo-form-group">
            <label htmlFor="phone">Phone Number <span className="optional">(optional)</span></label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="userinfo-input"
              placeholder="e.g. +1234567890"
            />
          </div>
          {error && <div className="userinfo-form-error">{error}</div>}
          <button className="userinfo-submit-btn" type="submit">
            Continue
          </button>
        </form>
      </div>
      <style jsx global>{`
        .userinfo-modal-card {
          background: #fff;
          max-width: 380px;
          margin: 0 auto;
          border-radius: 18px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.18), 0 1.5px 6px rgba(0,0,0,0.08);
          padding: 2.5rem 2rem 2rem 2rem;
          display: flex;
          flex-direction: column;
          align-items: stretch;
          position: relative;
        }
        .userinfo-close-btn {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: none;
          border: none;
          font-size: 1.5rem;
          color: #888;
          cursor: pointer;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: background-color 0.2s, color 0.2s;
        }
        .userinfo-close-btn:hover {
          background-color: rgba(255, 59, 59, 0.1);
          color: #ff3b3b;
        }
        .userinfo-modal-header {
          text-align: center;
          margin-bottom: 1.5rem;
        }
        .userinfo-modal-header h2 {
          margin: 0 0 0.25rem 0;
          font-size: 2rem;
          font-weight: 700;
          color: #003366;
        }
        .userinfo-modal-subtitle {
          color: #666;
          font-size: 1rem;
          margin: 0;
        }
        .userinfo-modal-form {
          display: flex;
          flex-direction: column;
          gap: 1.1rem;
        }
        .userinfo-form-group {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }
        .userinfo-form-group label {
          font-weight: 500;
          color: #222;
          margin-bottom: 0.1rem;
        }
        .userinfo-form-group .required {
          color: #ff3b3b;
          font-size: 1em;
        }
        .userinfo-form-group .optional {
          color: #aaa;
          font-size: 0.95em;
        }
        .userinfo-input {
          padding: 0.7rem 1rem;
          border: 1.5px solid #e0e0e0;
          border-radius: 8px;
          font-size: 1rem;
          transition: border 0.2s, box-shadow 0.2s;
          outline: none;
          background: #fafbfc;
        }
        .userinfo-input:focus {
          border: 1.5px solid #003366;
          box-shadow: 0 0 0 2px rgba(0, 51, 102, 0.2);
          background: #fff;
        }
        .userinfo-form-error {
          color: #ff3b3b;
          font-size: 0.98rem;
          margin-bottom: 0.5rem;
          text-align: center;
        }
        .userinfo-submit-btn {
          margin-top: 0.5rem;
          background: #003366;
          color: #fff;
          border: none;
          border-radius: 8px;
          padding: 0.85rem 0;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0, 51, 102, 0.08);
          transition: background 0.2s, box-shadow 0.2s;
        }
        .userinfo-submit-btn:hover, .userinfo-submit-btn:focus {
          background: #004080;
          box-shadow: 0 4px 16px rgba(0, 51, 102, 0.13);
        }
      `}</style>
    </div>
  );
};

export default UserInfoModal; 