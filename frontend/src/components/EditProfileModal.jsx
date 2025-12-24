import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { updateEmail, verifyBeforeUpdateEmail, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { api } from '../services/api';
import './EditProfileModal.css';

const EditProfileModal = ({ isOpen, onClose, currentUserData }) => {
    const [formData, setFormData] = useState({
        fullName: '',
        farmName: '',
        phone: '',
        email: '',
        currentPassword: '' // Required for re-auth and backend flow
    });
    const [otpSent, setOtpSent] = useState(false);
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (currentUserData) {
            setFormData({
                fullName: currentUserData.fullName || '',
                farmName: currentUserData.farmName || '',
                phone: currentUserData.phone || '',
                email: currentUserData.email || '', // Firestore email
                currentPassword: ''
            });
        }
    }, [currentUserData, isOpen]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleInitialSave = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const user = auth.currentUser;
            const emailChanged = formData.email !== currentUserData.email;

            // 1. If Email Changed -> Trigger OTP Flow
            if (emailChanged) {
                if (!formData.currentPassword) {
                    throw new Error("Please enter your current password to change email.");
                }
                // Send OTP to NEW email
                await api.register(formData.email, formData.currentPassword); // Use register to trigger OTP
                setOtpSent(true);
                setLoading(false);
                return; // Stop here and wait for OTP
            }

            // 2. If Email NOT Changed -> Just Update Firestore
            await updateDoc(doc(db, "users", user.uid), {
                fullName: formData.fullName,
                farmName: formData.farmName,
                phone: formData.phone
            });

            onClose();
            alert("Profile updated successfully!");
        } catch (err) {
            console.error(err);
            setError(err.message || "Failed to update profile.");
        } finally {
            if (!otpSent) setLoading(false);
        }
    };

    const handleVerifyAndSave = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        const user = auth.currentUser;

        try {
            // 1. Verify OTP with Backend (Syncs backend CSV)
            await api.verifyOtp(formData.email, otp);

            // 2. Re-authenticate User
            const credential = EmailAuthProvider.credential(user.email, formData.currentPassword);
            await reauthenticateWithCredential(user, credential);

            // 3. Update Firebase Auth Email (Using verifyBeforeUpdateEmail)
            try {
                // Try newer API first
                await verifyBeforeUpdateEmail(user, formData.email);
                alert(`Verification link sent to ${formData.email}. Please click the link to finish changing your email.`);
            } catch (authErr) {
                // Fallback or specific error handling
                console.warn("Primary email update failed, trying direct update:", authErr);
                // Note: If 'operation-not-allowed', it purely implies standard update is blocked.
                // We will rely on the verify link flow.
                if (authErr.code !== 'auth/operation-not-allowed') {
                    throw authErr;
                }
            }

            // 4. Update Firestore Profile
            // We update Firestore eagerly, but auth email will update only after they click the link
            await updateDoc(doc(db, "users", user.uid), {
                fullName: formData.fullName,
                farmName: formData.farmName,
                phone: formData.phone,
                email: formData.email // Update display email immediately
            });

            onClose();
        } catch (err) {
            console.error(err);
            if (err.code === 'auth/wrong-password') {
                setError("Invalid password. Please try again.");
            } else if (err.response && err.response.status === 400) {
                setError("Invalid or Expired OTP. Please try again.");
            } else {
                setError(err.message || "Failed to verify email change.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="edit-profile-modal-overlay">
            <div className="edit-profile-modal">
                <h2>Edit Profile</h2>
                {error && <div className="error-message" style={{ color: 'red', marginBottom: '1rem', textAlign: 'center', fontSize: '0.9rem' }}>{error}</div>}

                {!otpSent ? (
                    <form onSubmit={handleInitialSave} className="modal-form">
                        <div className="form-group">
                            <label>Full Name</label>
                            <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label>Farm Name</label>
                            <input type="text" name="farmName" value={formData.farmName} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label>Phone</label>
                            <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label>Email</label>
                            <input type="email" name="email" value={formData.email} onChange={handleChange} required />
                        </div>

                        {/* Only show Password field if email is changed to confirm identity */}
                        {formData.email !== currentUserData?.email && (
                            <div className="form-group" style={{ animation: 'fadeIn 0.3s' }}>
                                <label>Current Password (Required to change Email)</label>
                                <input type="password" name="currentPassword" value={formData.currentPassword} onChange={handleChange} required placeholder="Enter password to confirm" />
                            </div>
                        )}

                        <div className="modal-actions">
                            <button type="button" className="btn-cancel" onClick={onClose} disabled={loading}>Cancel</button>
                            <button type="submit" className="btn-save" disabled={loading}>
                                {loading ? 'Saving...' : (formData.email !== currentUserData?.email ? 'Verify & Save' : 'Save Changes')}
                            </button>
                        </div>
                    </form>
                ) : (
                    <form onSubmit={handleVerifyAndSave} className="modal-form">
                        <div className="otp-section">
                            <p style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>Enter the code sent to <b>{formData.email}</b></p>
                            <div className="form-group">
                                <label>Verification Code</label>
                                <input
                                    type="text"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    placeholder="Enter OTP"
                                    required
                                    maxLength={6}
                                    style={{ textAlign: 'center', letterSpacing: '4px', fontSize: '1.2rem' }}
                                />
                            </div>
                        </div>
                        <div className="modal-actions">
                            <button type="button" className="btn-cancel" onClick={() => setOtpSent(false)} disabled={loading}>Back</button>
                            <button type="submit" className="btn-save" disabled={loading}>
                                {loading ? 'Verifying...' : 'Confirm Update'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default EditProfileModal;
