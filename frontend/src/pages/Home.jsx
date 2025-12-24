import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    Milk, Activity, ShieldCheck, ChevronDown, CheckCircle,
    TrendingUp, Award, Users, ArrowRight, Play, Lock, User, MapPin, Phone, Mail
} from 'lucide-react';
import { auth, db } from '../firebase';
import { api } from '../services/api'; // Added API import
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import './LandingPage.css';

// --- Components ---

const Logo = () => (
    <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex items-center gap-2 font-black text-2xl"
        style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 900, fontSize: '1.5rem', color: '#6C4E31' }}
    >
        <div style={{ position: 'relative', width: 70, height: 70 }}>
            <img
                src="/calf-logo.png"
                alt="Calf AI"
                style={{
                    width: '100%', height: '100%', objectFit: 'contain',
                    borderRadius: '50%', border: '2px solid #6C4E31', padding: '2px',
                    background: '#FFEAC5'
                }}
            />
        </div>
        <h2 style={{ margin: 0 }}>Calf AI</h2>
    </motion.div>
);

const Section = ({ children, className = "" }) => (
    <motion.section
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8 }}
        className={`lp-section ${className}`}
        style={{ padding: '5rem 2rem', maxWidth: '1280px', margin: '0 auto' }}
    >
        {children}
    </motion.section>
);

const Card = ({ icon: Icon, title, desc, delay = 0 }) => (
    <motion.div
        className="lp-card"
        whileHover={{ y: -10, boxShadow: "0 20px 40px -5px rgba(96, 63, 38, 0.2)" }}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.5 }}
    >
        <div style={{ background: '#FFEAC5', width: 60, height: 60, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <Icon size={32} color="#6C4E31" />
        </div>
        <h3 className="lp-h3">{title}</h3>
        <p className="lp-text" style={{ fontSize: '1rem' }}>{desc}</p>
    </motion.div>
);

// --- Main Page ---

const Home = () => {
    const navigate = useNavigate();
    const [scrolled, setScrolled] = useState(false);
    const [showLogin, setShowLogin] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false); // Toggle between Login and Sign Up
    const [activeFaq, setActiveFaq] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [otpSent, setOtpSent] = useState(false); // New state for OTP flow
    const [otp, setOtp] = useState('');

    // Form State
    const [formData, setFormData] = useState({
        email: '', password: '', fullName: '', farmName: '', phone: ''
    });

    // Scroll listener for navbar
    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);

        // Auto-redirect if logged in
        if (localStorage.getItem('token')) {
            navigate('/dashboard');
        }

        return () => window.removeEventListener('scroll', handleScroll);
    }, [navigate]);

    // Disable background scroll when modal is open
    useEffect(() => {
        if (showLogin) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [showLogin]);

    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (isSignUp) {
                // --- Registration Flow ---
                if (!otpSent) {
                    // Step 1: Request OTP from Backend
                    console.log("Requesting OTP...");
                    await api.register(formData.email, formData.password);
                    setOtpSent(true);
                    console.log("OTP Sent.");
                    // Don't create Firebase user yet
                } else {
                    // Step 2: Verify OTP
                    console.log("Verifying OTP...");
                    await api.verifyOtp(formData.email, otp);
                    console.log("OTP Verified. Creating Firebase User...");

                    // Step 3: If Verified, Create Firebase User
                    let user;
                    try {
                        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
                        user = userCredential.user;
                        console.log("Firebase User Created:", user.uid);
                    } catch (firebaseErr) {
                        if (firebaseErr.code === 'auth/email-already-in-use') {
                            console.warn("User already in Firebase. Logging in...");
                            const loginCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
                            user = loginCredential.user;
                        } else {
                            throw firebaseErr; // Rethrow other errors
                        }
                    }

                    // Step 4: Save Extra Details to Firestore
                    console.log("Saving profile to Firestore...");
                    await setDoc(doc(db, "users", user.uid), {
                        fullName: formData.fullName,
                        farmName: formData.farmName,
                        phone: formData.phone,
                        email: formData.email,
                        createdAt: new Date(),
                        verified: true
                    }, { merge: true }); // Merge to avoid overwriting if exists

                    console.log("Profile Saved. Navigating...");
                    navigate('/dashboard');
                }
            } else {
                // --- Login Flow ---
                // Direct Firebase Login (assuming verified)
                await signInWithEmailAndPassword(auth, formData.email, formData.password);
                navigate('/dashboard');
            }

            // On success (except Step 1 of Register)
            if (!isSignUp || (isSignUp && otpSent)) {
                localStorage.setItem('token', 'firebase-session-active');
            }

        } catch (err) {
            console.error("Auth Error:", err);

            let message = "Something went wrong. Please try again.";
            const rawError = err.response?.data?.detail || err.message;

            if (rawError.includes('auth/invalid-email')) message = "Please enter a valid email address.";
            else if (rawError.includes('auth/user-not-found')) message = "No account found with this email.";
            else if (rawError.includes('auth/wrong-password')) message = "Incorrect password.";
            else if (rawError.includes('auth/email-already-in-use')) message = "This email is already registered.";
            else if (rawError.includes('auth/weak-password')) message = "Password should be at least 6 characters.";
            else if (rawError.includes('password cannot be longer than 72 bytes')) message = "Password is too long. Please use a shorter password.";
            else if (rawError.includes('Network Error')) message = "Unable to connect. Check your internet.";
            else if (rawError.includes('Invalid OTP')) message = "Use the correct code sent to your email.";
            else if (typeof rawError === 'string') message = rawError.replace('Firebase:', '').trim();

            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="lp-container">
            {/* Navbar */}
            <motion.nav
                className={`lp-navbar ${scrolled ? 'scrolled' : ''}`}
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <Logo />
                <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                    <button className="lp-btn-primary" onClick={() => { setIsSignUp(false); setShowLogin(true); }}>
                        Login
                    </button>
                </div>
            </motion.nav>

            {/* Hero Section */}
            <div style={{ paddingTop: '8rem', paddingBottom: '5rem', paddingLeft: '2rem', paddingRight: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
                <div className="hero-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', alignItems: 'center', gap: '4rem' }}>
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            style={{ display: 'inline-block', padding: '0.5rem 1rem', background: '#FFD8B5', borderRadius: 50, color: '#6C4E31', fontWeight: 'bold', marginBottom: '1.5rem', fontSize: '0.9rem' }}
                        >
                            ✨ Award-Winning AgriTech Solution
                        </motion.div>
                        <h1 className="lp-h1" style={{ marginBottom: '1.5rem' }}>
                            AI-Powered Dairy Intelligence for <span style={{ color: '#6C4E31' }}>Higher Yields</span>
                        </h1>
                        <p className="lp-text" style={{ marginBottom: '2.5rem', fontSize: '1.25rem' }}>
                            Predict milk output, detect diseases early, and optimize farm productivity using our advanced Neural Networks.
                        </p>
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                            <motion.button
                                className="lp-btn-primary"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => { setIsSignUp(true); setShowLogin(true); }}
                            >
                                Get Started
                            </motion.button>
                            <motion.button
                                className="lp-btn-secondary"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                onClick={() => { setIsSignUp(false); setShowLogin(true); }}
                            >
                                <Play size={18} fill="currentColor" /> View Demo
                            </motion.button>
                        </div>
                    </motion.div>

                    {/* 3D Model Placeholder area */}
                    <div className="cow-3d-wrapper" style={{ display: 'flex', justifyContent: 'center' }}>
                        {/* This mimics the 3D element requested */}
                        <div className="cow-3d-model">
                            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: '#FFEAC5', fontWeight: 900, fontSize: '2rem' }}>
                                AI
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* WHAT WE DO */}
            <Section>
                <motion.h2 className="lp-h2">What We Do</motion.h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                    <Card
                        icon={Milk}
                        title="Milk Yield Prediction"
                        desc="Advanced algorithms analyze feed and health data to forecast daily milk production with 94% accuracy."
                        delay={0}
                    />
                    <Card
                        icon={ShieldCheck}
                        title="Early Disease Detection"
                        desc="Identify potential health risks like Mastitis and Lameness days before visible symptoms appear."
                        delay={0.2}
                    />
                    <Card
                        icon={TrendingUp}
                        title="Smart Farm Insights"
                        desc="Get actionable, data-driven recommendations to optimize feed ratios and housing conditions."
                        delay={0.4}
                    />
                </div>
            </Section>

            {/* WHY CHOOSE US */}
            <Section className="lp-accent-bg" style={{ borderRadius: '2rem', color: '#FFEAC5' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center' }}>
                    <div>
                        {/* Abstract Illustration */}
                        <div style={{ background: '#FFEAC5', padding: '2rem', borderRadius: '1.5rem', transform: 'rotate(-2deg)' }}>
                            <div style={{ background: '#6C4E31', height: '200px', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem' }}>
                                🐄
                            </div>
                        </div>
                    </div>
                    <div>
                        <h2 className="lp-h2" style={{ textAlign: 'left', color: '#FFEAC5' }}>Why SmartDairy?</h2>
                        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {[
                                "AI models trained on >50k realistic farm data points",
                                "Reduce lethal disease mortality by up to 40%",
                                "Farmer-friendly dashboard (No PhD required)",
                                "Scalable from 5 to 5,000 head of cattle"
                            ].map((item, i) => (
                                <motion.li
                                    key={i}
                                    initial={{ opacity: 0, x: 50 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '1.2rem', color: '#FFEAC5' }}
                                >
                                    <CheckCircle size={24} color="#FFD8B5" /> {item}
                                </motion.li>
                            ))}
                        </ul>
                    </div>
                </div>
            </Section>

            {/* DIFFERENTIATOR */}
            <Section>
                <h2 className="lp-h2">The AI Advantage</h2>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #6C4E31' }}>
                                <th style={{ padding: '1.5rem', textAlign: 'left', fontSize: '1.2rem', color: '#603F26' }}>Traditional Farming</th>
                                <th style={{ padding: '1.5rem', textAlign: 'left', fontSize: '1.5rem', color: '#6C4E31', fontWeight: 900 }}>Calf AI</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[
                                ["Manual observation", "24/7 AI Monitoring"],
                                ["Reactive treatment", "Predictive Alerts"],
                                ["Guess-based feeding", "Optimized Nutrition"],
                                ["Notebook records", "Cloud Analytics"]
                            ].map((row, i) => (
                                <motion.tr
                                    key={i}
                                    initial={{ opacity: 0 }}
                                    whileInView={{ opacity: 1 }}
                                    transition={{ delay: i * 0.1 }}
                                    style={{ borderBottom: '1px solid rgba(108, 78, 49, 0.1)' }}
                                >
                                    <td style={{ padding: '1.5rem', color: '#856E58' }}>{row[0]}</td>
                                    <td style={{ padding: '1.5rem', color: '#6C4E31', fontWeight: 'bold' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <CheckCircle size={16} /> {row[1]}
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Section>

            {/* TRUST */}
            <Section>
                <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '2rem', textAlign: 'center' }}>
                    {[
                        { val: "30%", label: "Reduction in Med Costs" },
                        { val: "15%", label: "Increase in Milk Yield" },
                        { val: "94%", label: "Prediction Accuracy" }
                    ].map((stat, i) => (
                        <motion.div
                            key={i}
                            whileHover={{ scale: 1.1 }}
                            className="lp-card"
                            style={{ minWidth: '200px', background: 'transparent', border: 'none', boxShadow: 'none' }}
                        >
                            <div style={{ fontSize: '3.5rem', fontWeight: 900, color: '#6C4E31' }}>{stat.val}</div>
                            <div style={{ color: '#856E58', fontSize: '1.1rem' }}>{stat.label}</div>
                        </motion.div>
                    ))}
                </div>
            </Section>

            {/* FAQ */}
            <Section>
                <h2 className="lp-h2">FAQ</h2>
                <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {[
                        { q: "How exact are the predictions?", a: "Our models are trained on validated datasets and typically achieve 90-95% accuracy in controlled environments." },
                        { q: "Do I need expensive sensors?", a: "No! You can manually enter data like feed type and weight, and our AI does the rest. Sensors are optional." },
                        { q: "Is my farm data secure?", a: "Absolutely. We use enterprise-grade encryption and your data never leaves the secure cloud environment." }
                    ].map((item, i) => (
                        <motion.div
                            key={i}
                            className="lp-card"
                            style={{ padding: '1.5rem', cursor: 'pointer', borderRadius: '1rem' }}
                            onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 'bold', fontSize: '1.1rem' }}>
                                {item.q}
                                <motion.div animate={{ rotate: activeFaq === i ? 180 : 0 }}>
                                    <ChevronDown />
                                </motion.div>
                            </div>
                            <AnimatePresence>
                                {activeFaq === i && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        style={{ overflow: 'hidden' }}
                                    >
                                        <p style={{ paddingTop: '1rem', color: '#603F26' }}>{item.a}</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}
                </div>
            </Section>

            {/* CTA */}
            <section style={{ padding: '6rem 2rem', background: '#6C4E31', color: '#FFEAC5', textAlign: 'center', marginTop: '4rem' }}>
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <h2 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '1.5rem' }}>Transform Your Dairy Farm Today</h2>
                    <p style={{ fontSize: '1.25rem', marginBottom: '3rem', opacity: 0.9 }}>Join hundreds of modern farmers using AI to build a sustainable future.</p>
                    <button
                        className="lp-btn-primary"
                        style={{ background: '#FFEAC5', color: '#6C4E31', fontSize: '1.2rem', padding: '1.2rem 3rem' }}
                        onClick={() => { setIsSignUp(true); setShowLogin(true); }}
                    >
                        Start Free Demo
                    </button>
                </motion.div>
            </section>

            {/* Footer */}
            <footer style={{ background: '#FFD8B5', color: '#6C4E31', padding: '4rem 2rem', marginTop: '4rem' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '3rem' }}>

                    {/* Brand & Mission */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                            <div style={{ width: 40, height: 40, background: '#FFEAC5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #6C4E31' }}>
                                <img src="/calf-logo.png" alt="Logo" style={{ width: '80%', height: '80%', objectFit: 'contain', borderRadius: '50%' }} />
                            </div>
                            <span style={{ fontSize: '1.5rem', fontWeight: 900 }}>Calf AI</span>
                        </div>
                        <p style={{ opacity: 0.8, lineHeight: 1.6, maxWidth: '300px' }}>
                            Empowering dairy farmers with state-of-the-art Artificial Intelligence to ensure cattle health and maximize yields.
                        </p>
                    </div>

                    {/* Contact Us */}
                    <div>
                        <h3 className="lp-h3" style={{ color: '#6C4E31', marginBottom: '1.5rem' }}>Contact Us</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', items: 'center', gap: '1rem' }}>
                                <Mail size={20} color="#6C4E31" />
                                <span style={{ opacity: 0.9 }}>support@calfai.com</span>
                            </div>
                            <div style={{ display: 'flex', items: 'center', gap: '1rem' }}>
                                <Phone size={20} color="#6C4E31" />
                                <span style={{ opacity: 0.9 }}>+91 98765 43210</span>
                            </div>
                            <div style={{ display: 'flex', items: 'center', gap: '1rem' }}>
                                <MapPin size={20} color="#6C4E31" />
                                <span style={{ opacity: 0.9 }}>AgriTech Park, Bangalore, India</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ borderTop: '1px solid rgba(108, 78, 49, 0.2)', marginTop: '3rem', paddingTop: '1.5rem', textAlign: 'center', opacity: 0.6, fontSize: '0.9rem' }}>
                    © 2025 Calf AI. All rights reserved.
                </div>
            </footer>

            {/* LOGIN / SIGNUP MODAL */}
            <AnimatePresence>
                {showLogin && (
                    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            style={{ position: 'absolute', width: '100%', height: '100%', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(5px)' }}
                            onClick={() => setShowLogin(false)}
                        />
                        <motion.div
                            className="lp-glass-modal"
                            initial={{ scale: 0.8, opacity: 0, y: 50 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.8, opacity: 0, y: 50 }}
                            style={{ width: '90%', maxWidth: '420px', padding: '2.5rem', position: 'relative', zIndex: 1001, maxHeight: '90vh', overflowY: 'auto' }}
                        >
                            <h2 className="lp-h3" style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
                                {isSignUp ? 'Create Your Account' : 'Welcome Back'}
                            </h2>
                            <p style={{ textAlign: 'center', marginBottom: '1.5rem', fontSize: '0.9rem', opacity: 0.8 }}>
                                {isSignUp ? 'Join the future of dairy farming' : 'Enter your details to access the dashboard'}
                            </p>

                            {error && (
                                <div style={{ background: '#fee2e2', color: '#991b1b', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.9rem', textAlign: 'center' }}>
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleAuth}>
                                {isSignUp && (
                                    <>
                                        <div style={{ marginBottom: '1rem' }}>
                                            <div style={{ position: 'relative' }}>
                                                <User size={18} style={{ position: 'absolute', top: '12px', left: '12px', color: '#6C4E31', opacity: 0.6 }} />
                                                <input
                                                    type="text"
                                                    placeholder="Full Name"
                                                    className="lp-input"
                                                    style={{ paddingLeft: '2.5rem' }}
                                                    value={formData.fullName}
                                                    onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div style={{ marginBottom: '1rem' }}>
                                            <div style={{ position: 'relative' }}>
                                                <MapPin size={18} style={{ position: 'absolute', top: '12px', left: '12px', color: '#6C4E31', opacity: 0.6 }} />
                                                <input
                                                    type="text"
                                                    placeholder="Farm Name"
                                                    className="lp-input"
                                                    style={{ paddingLeft: '2.5rem' }}
                                                    value={formData.farmName}
                                                    onChange={e => setFormData({ ...formData, farmName: e.target.value })}
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div style={{ marginBottom: '1rem' }}>
                                            <div style={{ position: 'relative' }}>
                                                <Phone size={18} style={{ position: 'absolute', top: '12px', left: '12px', color: '#6C4E31', opacity: 0.6 }} />
                                                <input
                                                    type="tel"
                                                    placeholder="Phone Number (Optional)"
                                                    className="lp-input"
                                                    style={{ paddingLeft: '2.5rem' }}
                                                    value={formData.phone}
                                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </>
                                )}

                                <div style={{ marginBottom: '1rem' }}>
                                    <div style={{ position: 'relative' }}>
                                        <Mail size={18} style={{ position: 'absolute', top: '12px', left: '12px', color: '#6C4E31', opacity: 0.6 }} />
                                        <input
                                            type="email"
                                            placeholder="Email Address"
                                            className="lp-input"
                                            style={{ paddingLeft: '2.5rem' }}
                                            value={formData.email}
                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <div style={{ position: 'relative' }}>
                                        <Lock size={18} style={{ position: 'absolute', top: '12px', left: '12px', color: '#6C4E31', opacity: 0.6 }} />
                                        <input
                                            type="password"
                                            placeholder="Password"
                                            className="lp-input"
                                            style={{ paddingLeft: '2.5rem' }}
                                            value={formData.password}
                                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                                            required
                                            minLength={6}
                                            maxLength={72}
                                        />
                                    </div>
                                </div>

                                {otpSent && isSignUp && (
                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <div style={{ position: 'relative' }}>
                                            <ShieldCheck size={18} style={{ position: 'absolute', top: '12px', left: '12px', color: '#6C4E31', opacity: 0.6 }} />
                                            <input
                                                type="text"
                                                placeholder="Enter OTP from Email"
                                                className="lp-input"
                                                style={{ paddingLeft: '2.5rem', borderColor: '#6C4E31', background: '#fff' }}
                                                value={otp}
                                                onChange={e => setOtp(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <p style={{ fontSize: '0.8rem', color: '#603F26', marginTop: '0.5rem', textAlign: 'center' }}>
                                            We sent a code to {formData.email}
                                        </p>
                                    </div>
                                )}

                                <button type="submit" className="lp-btn-primary" style={{ width: '100%' }} disabled={loading}>
                                    {loading ? 'Processing...' : (isSignUp ? (otpSent ? 'Verify & Create Account' : 'Send Verification Code') : 'Sign In')}
                                </button>
                            </form>

                            <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>
                                <span style={{ opacity: 0.7 }}>
                                    {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                                </span>
                                <strong
                                    style={{ cursor: 'pointer', color: '#6C4E31' }}
                                    onClick={() => { setIsSignUp(!isSignUp); setError(''); setOtpSent(false); }}
                                >
                                    {isSignUp ? 'Sign In' : 'Sign Up'}
                                </strong>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Home;
