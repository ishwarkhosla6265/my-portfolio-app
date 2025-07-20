import React, { useState, useEffect, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from 'firebase/auth';
import {
    getFirestore,
    doc,
    setDoc,
    getDoc,
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    updateDoc
} from 'firebase/firestore';
import {
    getStorage,
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject
} from 'firebase/storage';

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyDBiwF5W6_SR1MpOhZr_ZduAIpNV_G7jsk",
    authDomain: "hackathon-portfolio-aggregator.firebaseapp.com",
    projectId: "hackathon-portfolio-aggregator",
    storageBucket: "hackathon-portfolio-aggregator.appspot.com",
    messagingSenderId: "306813852343",
    appId: "1:306813852343:web:c99d9773b4942b82e8cb32",
    measurementId: "G-6N254QMQ15"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Helper Functions & Components
const useBodyStyle = () => {
    useEffect(() => {
        document.body.className = 'bg-gradient-to-br from-blue-100 to-green-100 text-slate-800 font-roboto';
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundPosition = 'center';
        document.body.style.backgroundAttachment = 'fixed';
    }, []);
};

const Icon = ({ name, className = '' }) => <i className={`fas fa-${name} ${className}`}></i>;

const Toast = ({ message, type, onDismiss }) => {
    useEffect(() => {
        const timer = setTimeout(onDismiss, 3000);
        return () => clearTimeout(timer);
    }, [onDismiss]);

    const styles = {
        success: { bg: 'bg-green-500', icon: 'check-circle' },
        error: { bg: 'bg-red-500', icon: 'exclamation-circle' },
        info: { bg: 'bg-blue-500', icon: 'info-circle' },
    };

    return (
        <div className={`fixed bottom-5 right-5 flex items-center p-4 rounded-lg text-white shadow-lg z-50 animate-fade-in-up ${styles[type]?.bg || 'bg-gray-700'}`}>
            <Icon name={styles[type]?.icon || 'comment-dots'} className="mr-3" />
            {message}
        </div>
    );
};

const Modal = ({ children, onClose }) => (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-300">
        <div className="bg-white rounded-2xl p-8 max-w-lg w-full m-4 relative shadow-2xl border border-gray-300">
            <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 text-2xl transition-colors">
                <Icon name="times-circle" />
            </button>
            {children}
        </div>
    </div>
);

const PortfolioItemForm = ({ onSave, onCancel, item = {}, type }) => {
    const [title, setTitle] = useState(item?.title || '');
    const [description, setDescription] = useState(item?.description || '');
    const [url, setUrl] = useState(item?.url || '');
    const [date, setDate] = useState(item?.date || '');
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        setTitle(item?.title || '');
        setDescription(item?.description || '');
        setUrl(item?.url || '');
        setDate(item?.date || '');
        setFile(null); // Reset file when item changes
    }, [item]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setUploading(true);
        const { id, ...data } = { title, description, url, date };
        await onSave({ ...item, ...data }, file);
        setUploading(false);
    };

    const handleFileChange = (e) => {
        if (e.target.files[0]) setFile(e.target.files[0]);
    };

    const typePlaceholders = {
        project: { title: "Project Name", description: "Describe your project...", url: "https://github.com/..." },
        achievement: { title: "Achievement Name", description: "Describe your achievement...", url: "https://example.com/..." },
        certificate: { title: "Certificate Name", description: "Issuing organization...", url: "https://credential.net/..." },
    };

    const placeholders = typePlaceholders[type] || { title: "Title", description: "Description", url: "URL" };

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-slate-800 mb-2 flex items-center font-montserrat">
                <Icon name={item?.id ? 'pencil-alt' : 'plus-circle'} className="mr-3 text-blue-500" />
                {item?.id ? 'Edit' : 'Add'} {type ? (type.charAt(0).toUpperCase() + type.slice(1)) : 'Item'}
            </h2>
            <div className="space-y-4">
                <input type="text" placeholder={placeholders.title} value={title} onChange={e => setTitle(e.target.value)} className="w-full p-3 bg-slate-100/80 border-2 border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-md transition" required />
                <textarea placeholder={placeholders.description} value={description} onChange={e => setDescription(e.target.value)} className="w-full p-3 bg-slate-100/80 border-2 border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 h-28 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-md transition" required></textarea>
                <input type="url" placeholder={placeholders.url} value={url} onChange={e => setUrl(e.target.value)} className="w-full p-3 bg-slate-100/80 border-2 border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-md transition" />
                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full p-3 bg-slate-100/80 border-2 border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 shadow-md" />
                <div>
                    <label className="text-slate-600 block mb-2 font-medium">Upload a file (optional)</label>
                    <input type="file" onChange={handleFileChange} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-all duration-300 cursor-pointer" />
                    {file && <p className="text-green-600 text-sm mt-2">Selected: {file.name}</p>}
                    {item?.fileUrl && !file && <p className="text-slate-500 text-sm mt-2">Current file: <a href={item.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View File</a></p>}
                </div>
            </div>
            <div className="flex justify-end space-x-4 pt-4">
                <button type="button" onClick={onCancel} className="px-6 py-2 rounded-full font-semibold bg-slate-200 text-slate-800 hover:bg-slate-300 transition-all duration-300 transform hover:scale-105">Cancel</button>
                <button type="submit" disabled={uploading} onClick={handleSubmit} className="px-6 py-2 rounded-full font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 disabled:bg-slate-400 disabled:scale-100">
                    {uploading ? 'Saving...' : 'Save'}
                </button>
            </div>
        </div>
    );
};

const PortfolioCard = ({ item, onEdit, onDelete }) => (
    <div className="bg-gray-100 border border-gray-300 rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:scale-105 flex flex-col">
        <div className="flex-grow">
            <h3 className="text-xl font-bold text-slate-900 font-montserrat">{item.title}</h3>
            {item.date && <p className="text-sm text-slate-500 mb-2">{new Date(item.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}</p>}
            <p className="text-slate-600 mb-4">{item.description}</p>
        </div>
        <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-200">
            <div className="flex space-x-4">
                {item.url && (
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 font-semibold transition-colors">
                        View Link <Icon name="external-link-alt" className="text-xs ml-1" />
                    </a>
                )}
                {item.fileUrl && (
                    <a href={item.fileUrl} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-800 font-semibold transition-colors">
                        View File <Icon name="file-alt" className="text-xs ml-1" />
                    </a>
                )}
            </div>
            <div className="flex space-x-3">
                <button onClick={() => onEdit(item)} className="text-slate-400 hover:text-green-500 transition-colors"><Icon name="pencil-alt" /></button>
                <button onClick={() => onDelete(item)} className="text-slate-400 hover:text-red-500 transition-colors"><Icon name="trash-alt" /></button>
            </div>
        </div>
    </div>
);

const AuthPage = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [isLogin, setIsLogin] = useState(true);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleAuthAction = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        const { email, password } = formData;
        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                await setDoc(doc(db, "profiles", userCredential.user.uid), {
                    name: "New User",
                    bio: "A short bio about yourself.",
                    email: userCredential.user.email,
                });
            }
        } catch (err) {
            switch (err.code) {
                case 'auth/invalid-credential':
                case 'auth/user-not-found':
                case 'auth/wrong-password':
                    setError("Invalid email or password.");
                    break;
                case 'auth/email-already-in-use':
                    setError("Email already in use.");
                    break;
                case 'auth/weak-password':
                    setError("Password too weak (min 6 characters).");
                    break;
                default:
                    setError("An error occurred.");
                    break;
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-gradient-to-br from-blue-500 to-green-500 min-h-screen flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-5xl font-bold mb-2 text-white font-montserrat">Portfolio Pilot</h1>
                    <p className="text-slate-100">Sign in or create an account to manage your portfolio.</p>
                </div>
                <div className="bg-white/80 backdrop-blur-lg p-8 rounded-2xl shadow-xl border border-white/30">
                    <div className="space-y-6">
                        <input name="email" type="email" placeholder="Email" value={formData.email} onChange={handleChange} className="w-full p-4 bg-slate-100/80 border-2 border-slate-200 rounded-lg text-slate-800 shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition" required />
                        <input name="password" type="password" placeholder="Password" value={formData.password} onChange={handleChange} className="w-full p-4 bg-slate-100/80 border-2 border-slate-200 rounded-lg text-slate-800 shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition" required />
                        <button type="submit" disabled={loading} onClick={handleAuthAction} className="w-full p-4 bg-blue-600 text-white rounded-full font-bold hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 disabled:bg-slate-400 disabled:scale-100">
                            {loading ? 'Processing...' : (isLogin ? 'Login' : 'Sign Up')}
                        </button>
                        {error && <p className="text-red-500 text-center pt-2">{error}</p>}
                    </div>
                    <p className="text-center mt-6">
                        <button onClick={() => setIsLogin(!isLogin)} className="text-blue-600 hover:underline">
                            {isLogin ? "Need an account? Sign Up" : "Already have an account? Login"}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

const Dashboard = ({ user, showToast }) => {
    const [profile, setProfile] = useState({ name: '', bio: '' });
    const [items, setItems] = useState({ projects: [], achievements: [], certificates: [] });
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState(null);
    const [currentType, setCurrentType] = useState('project');

    const fetchAllData = useCallback(async () => {
        setLoading(true);
        const profileDoc = await getDoc(doc(db, "profiles", user.uid));
        if (profileDoc.exists()) setProfile(profileDoc.data());

        const types = ['projects', 'achievements', 'certificates'];
        const allItems = {};
        for (const type of types) {
            const itemsCol = await getDocs(collection(db, "profiles", user.uid, type));
            allItems[type] = itemsCol.docs.map(d => ({ id: d.id, ...d.data() }));
        }
        setItems(allItems);
        setLoading(false);
    }, [user.uid]);

    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    const handleSaveItem = async (itemData, file) => {
        const collectionPath = `profiles/${user.uid}/${currentType}s`;
        let finalItemData = { ...itemData };

        try {
            if (!navigator.onLine) {
                showToast('No internet connection.', 'error');
                return;
            }

            if (file && file.size > 0) {
                const filePath = `profiles/${user.uid}/${currentType}s/${Date.now()}-${file.name}`;
                const fileRef = ref(storage, filePath);
                await uploadBytes(fileRef, file);
                finalItemData.fileUrl = await getDownloadURL(fileRef);
                finalItemData.filePath = filePath;
            } else if (file) {
                showToast('Empty file detected. File upload skipped.', 'info');
            }

            if (finalItemData.id) {
                await updateDoc(doc(db, collectionPath, finalItemData.id), finalItemData);
                showToast('Item updated successfully!', 'success');
            } else {
                await addDoc(collection(db, collectionPath), finalItemData);
                showToast('Item added successfully!', 'success');
            }

            await fetchAllData();
            setModalOpen(false);
            setCurrentItem(null);
        } catch (error) {
            console.error("Upload error:", error);
            showToast('Failed to save item. Check console for details.', 'error');
        }
    };

    const handleDeleteItem = async (item, type) => {
        if (window.confirm("Are you sure you want to delete this item?")) {
            try {
                const collectionPath = `profiles/${user.uid}/${type}s`;
                await deleteDoc(doc(db, collectionPath, item.id));

                if (item.filePath) {
                    await deleteObject(ref(storage, item.filePath));
                }
                showToast('Item deleted.', 'info');
                setItems(prev => ({ ...prev, [`${type}s`]: prev[`${type}s`].filter(i => i.id !== item.id) }));
            } catch (error) {
                showToast('Failed to delete item.', 'error');
            }
        }
    };

    const handleOpenModal = (type, item = null) => {
        setCurrentType(type);
        setCurrentItem(item);
        setModalOpen(true);
    };

    const handleProfileChange = (e) => setProfile({ ...profile, [e.target.name]: e.target.value });

    const handleProfileSave = async () => {
        try {
            await setDoc(doc(db, "profiles", user.uid), profile, { merge: true });
            showToast('Profile updated!', 'success');
        } catch (error) {
            showToast('Failed to update profile.', 'error');
        }
    };

    const publicProfileUrl = `${window.location.origin}${window.location.pathname}#profile/${user.uid}`;

    if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-800 text-2xl font-mont…">Loading Dashboard...</div>;

    return (
        <div className="min-h-screen">
            {modalOpen && <Modal onClose={() => setModalOpen(false)}><PortfolioItemForm onSave={handleSaveItem} onCancel={() => setModalOpen(false)} item={currentItem} type={currentType} /></Modal>}
            <header className="bg-gradient-to-r from-blue-600 to-green-600 p-4 flex justify-between items-center sticky top-0 z-40 shadow-lg">
                <h1 className="text-2xl font-bold text-white font-montserrat">Dashboard</h1>
                <div className="flex items-center space-x-4">
                    <button onClick={() => { navigator.clipboard.writeText(publicProfileUrl); showToast('URL copied!', 'info'); }} className="px-4 py-2 rounded-full bg-green-500 text-white hover:bg-green-600 transition-all duration-300 transform hover:scale-105 font-semibold text-sm"><Icon name="link" className="mr-2" /> Copy Public Link</button>
                    <button onClick={() => signOut(auth)} className="px-4 py-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition-all duration-300 transform hover:scale-105 font-semibold text-sm"><Icon name="sign-out-alt" className="mr-2" /> Logout</button>
                </div>
            </header>
            <main className="container mx-auto p-4 md:p-8">
                <section className="mb-12 bg-gray-100 border border-gray-300 p-8 rounded-2xl shadow-lg">
                    <h2 className="text-3xl font-bold mb-4 text-slate-800 font-montserrat">My Profile</h2>
                    <div className="space-y-4">
                        <input type="text" name="name" value={profile.name} onChange={handleProfileChange} placeholder="Your Name" className="w-full p-3 bg-slate-100/80 border-2 border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-md transition" />
                        <textarea name="bio" value={profile.bio} onChange={handleProfileChange} placeholder="Your Bio" className="w-full p-3 bg-slate-100/80 border-2 border-slate-200 rounded-lg h-24 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-md transition"></textarea>
                        <button onClick={handleProfileSave} className="px-6 py-2 rounded-full font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-all duration-300 transform hover:scale-105">Save Profile</button>
                    </div>
                </section>
                {Object.keys(items).map(type => (
                    <section key={type} className="mb-12">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-3xl font-bold capitalize text-slate-800 font-montserrat">{type}</h2>
                            <button onClick={() => handleOpenModal(type.slice(0, -1))} className="px-6 py-2 rounded-full font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-all duration-300 transform hover:scale-105"><Icon name="plus" className="mr-2" /> Add {type.slice(0, -1)}</button>
                        </div>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {items[type].map(item => <PortfolioCard key={item.id} item={item} onEdit={(itemToEdit) => handleOpenModal(type.slice(0, -1), itemToEdit)} onDelete={(itemToDelete) => handleDeleteItem(itemToDelete, type.slice(0, -1))} />)}
                            {items[type].length === 0 && <div className="text-slate-500 bg-gray-100 border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center md:col-span-2 lg:col-span-3">No {type} added yet.</div>}
                        </div>
                    </section>
                ))}
            </main>
        </div>
    );
};

const PublicProfile = ({ userId }) => {
    const [profile, setProfile] = useState(null);
    const [items, setItems] = useState({ projects: [], achievements: [], certificates: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchPublicData = async () => {
            try {
                const profileDoc = await getDoc(doc(db, "profiles", userId));
                if (!profileDoc.exists()) {
                    setError("Profile not found.");
                    return;
                }
                setProfile(profileDoc.data());

                const types = ['projects', 'achievements', 'certificates'];
                const allItems = {};
                for (const type of types) {
                    const itemsCol = await getDocs(collection(db, "profiles", userId, type));
                    allItems[type] = itemsCol.docs.map(d => ({ id: d.id, ...d.data() }));
                }
                setItems(allItems);
            } catch (err) {
                setError("Failed to load profile.");
            } finally {
                setLoading(false);
            }
        };
        fetchPublicData();
    }, [userId]);

    if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-800 text-2xl font-montserrat">Loading Profile...</div>;
    if (error) return <div className="min-h-screen flex items-center justify-center text-red-500 text-2xl font-montserrat">{error}</div>;

    return (
        <div className="min-h-screen">
            <main className="container mx-auto p-4 md:p-8">
                <header className="text-center my-12 bg-gradient-to-r from-blue-600 to-green-600 p-8 rounded-2xl text-white shadow-lg">
                    <h1 className="text-6xl font-extrabold font-montserrat">{profile.name}</h1>
                    <p className="text-xl mt-4 max-w-3xl mx-auto">{profile.bio}</p>
                    <p className="mt-2"><Icon name="envelope" className="mr-2" /> {profile.email}</p>
                </header>
                {Object.keys(items).map(type => (
                    items[type].length > 0 && (
                        <section key={type} className="mb-12">
                            <h2 className="text-4xl font-bold capitalize mb-8 border-b-2 border-slate-200 pb-4 text-slate-800 font-montserrat">{type}</h2>
                            <div className="space-y-8">
                                {items[type].map(item => (
                                    <div key={item.id} className="bg-gray-100 border border-gray-300 p-6 rounded-2xl shadow-md">
                                        <h3 className="text-2xl font-bold text-slate-900 font-montserrat">{item.title}</h3>
                                        {item.date && <p className="text-sm text-slate-500 mb-2">{new Date(item.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}</p>}
                                        <p className="text-slate-600 my-4 text-base leading-relaxed">{item.description}</p>
                                        <div className="flex space-x-4 mt-4 pt-4 border-t border-slate-200">
                                            {item.url && <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 font-semibold transition-colors">View Link <Icon name="external-link-alt" className="text-xs ml-1" /></a>}
                                            {item.fileUrl && <a href={item.fileUrl} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-800 font-semibold transition-colors">View File <Icon name="file-alt" className="text-xs ml-1" /></a>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )
                ))}
            </main>
            <footer className="text-center p-8 text-slate-500 bg-white/70 backdrop-blur-lg">
                <p>Powered by Portfolio Pilot</p>
                <button onClick={() => window.location.hash = '#'} className="text-blue-600 hover:underline mt-2">Create your own portfolio</button>
            </footer>
        </div>
    );
};

export default function App() {
    useBodyStyle();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState({ name: 'auth', props: {} });
    const [toast, setToast] = useState(null);

    const showToast = (message, type = 'info') => {
        setToast({ message, type, key: Date.now() });
    };

    useEffect(() => {
        const handleHashChange = () => {
            const hash = window.location.hash.slice(1);
            if (hash.startsWith('profile/')) {
                setView({ name: 'profile', props: { userId: hash.split('/')[1] } });
            } else if (auth.currentUser) {
                setView({ name: 'dashboard', props: {} });
            } else {
                setView({ name: 'auth', props: {} });
            }
        };

        const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
            handleHashChange();
        });

        window.addEventListener('hashchange', handleHashChange);
        handleHashChange();

        return () => {
            unsubscribeAuth();
            window.removeEventListener('hashchange', handleHashChange);
        };
    }, []);

    const renderView = () => {
        switch (view.name) {
            case 'dashboard':
                return user ? <Dashboard user={user} showToast={showToast} /> : <AuthPage />;
            case 'profile':
                return <PublicProfile {...view.props} />;
            case 'auth':
            default:
                return user ? <Dashboard user={user} showToast={showToast} /> : <AuthPage />;
        }
    };

    return (
        <>
            {loading ? (
                <div className="min-h-screen flex items-center justify-center text-slate-800 text-3xl font-bold font-montserrat">Initializing...</div>
            ) : (
                renderView()
            )}
            {toast && <Toast key={toast.key} message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
        </>
    );
}