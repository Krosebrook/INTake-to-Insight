/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from 'react';
import { 
    User as UserIcon, Settings as SettingsIcon, Users, Palette, Database, Shield, 
    BarChart3, History, Globe, Mail, ChevronRight, Save, Trash2, 
    Plus, Lock, ExternalLink, RefreshCw, Smartphone, Check, X,
    Slack, Github, Figma, MoreVertical, Send, Loader2, Info, AlertCircle, Key, Search
} from 'lucide-react';
import { db } from '../lib/db';
import { TeamMember, AuditEntry, BrandKit, Workspace, User } from '../types';
import BrandKitEditor from './BrandKitEditor';

type SettingsTab = 'profile' | 'workspace' | 'team' | 'integrations' | 'security' | 'usage' | 'audit';

const Settings: React.FC = () => {
    const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
    const [searchQuery, setSearchQuery] = useState('');
    
    // User / Profile State
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [profileName, setProfileName] = useState('');
    const [profilePersona, setProfilePersona] = useState('');

    // Workspace State
    const [workspace, setWorkspace] = useState<Workspace | null>(null);
    
    // Team State
    const [team, setTeam] = useState<TeamMember[]>([]);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState<'ADMIN' | 'EDITOR' | 'VIEWER'>('VIEWER');
    const [isInviting, setIsInviting] = useState(false);
    const [actionMenuId, setActionMenuId] = useState<string | null>(null);

    // Security State
    const [ssoEnabled, setSsoEnabled] = useState(false);
    const [ssoProvider, setSsoProvider] = useState<'OIDC' | 'SAML'>('OIDC');
    const [enforce2FA, setEnforce2FA] = useState(false);

    // Audit / General UI
    const [logs, setLogs] = useState<AuditEntry[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const user = await db.getCurrentUser();
        const ws = await db.getWorkspace();
        const t = await db.getTeam();
        const l = await db.getAuditLogs();
        
        // Mock default current user if none
        if (!user) {
            const newUser: User = { 
                id: 'u-1', 
                name: 'John Doe', 
                email: 'john@enterprise.com', 
                role: 'ADMIN', 
                persona: 'Strategic Advisor (Concise, High-level)' 
            };
            await db.updateCurrentUser(newUser);
            setCurrentUser(newUser);
            setProfileName(newUser.name);
            setProfilePersona(newUser.persona || '');
        } else {
            setCurrentUser(user);
            setProfileName(user.name);
            setProfilePersona(user.persona || '');
        }

        // Mock default workspace if none
        if (!ws) {
            const newWs: Workspace = {
                id: 'ws-1',
                name: 'Strategic Operations HQ',
                plan: 'ENTERPRISE',
                ownerId: 'u-1'
            };
            await db.updateWorkspace(newWs);
            setWorkspace(newWs);
        } else {
            setWorkspace(ws);
        }

        // Mock team if empty
        if (t.length === 0) {
            const members: TeamMember[] = [
                { id: 'u-1', name: 'John Doe', email: 'john@enterprise.com', role: 'ADMIN', status: 'ACTIVE', joinedAt: Date.now() },
                { id: 'u-2', name: 'Jane Smith', email: 'jane@enterprise.com', role: 'EDITOR', status: 'ACTIVE', joinedAt: Date.now() - 1000000 },
                { id: 'u-3', name: 'Rick Sanchez', email: 'rick@c137.com', role: 'VIEWER', status: 'INVITED', joinedAt: Date.now() }
            ];
            for (const m of members) await db.updateMember(m);
            setTeam(members);
        } else {
            setTeam(t);
        }

        setLogs(l);
    };

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleUpdateProfile = async () => {
        if (!currentUser) return;
        setIsSaving(true);
        const updatedUser = { ...currentUser, name: profileName, persona: profilePersona };
        await db.updateCurrentUser(updatedUser);
        setCurrentUser(updatedUser);
        
        await db.addAuditLog({
            id: Date.now().toString(),
            userId: currentUser.id,
            userName: currentUser.name,
            action: 'EDIT',
            details: 'Updated personal profile settings',
            timestamp: Date.now()
        });
        
        setLogs(await db.getAuditLogs());
        setIsSaving(false);
        showToast("Profile updated successfully");
    };

    const handleInviteMember = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteEmail) return;
        setIsInviting(true);
        
        // Simulate email sending delay
        await new Promise(r => setTimeout(r, 1500));
        
        const newMember: TeamMember = {
            id: 'u-' + Math.random().toString(36).substr(2, 9),
            name: inviteEmail.split('@')[0],
            email: inviteEmail,
            role: inviteRole,
            status: 'INVITED',
            joinedAt: Date.now()
        };

        await db.updateMember(newMember);
        await db.addAuditLog({
            id: Date.now().toString(),
            userId: currentUser?.id || 'sys',
            userName: currentUser?.name || 'System',
            action: 'INVITE',
            details: `Invited ${inviteEmail} as ${inviteRole}`,
            timestamp: Date.now()
        });

        setTeam(await db.getTeam());
        setLogs(await db.getAuditLogs());
        setIsInviting(false);
        setShowInviteModal(false);
        setInviteEmail('');
        showToast(`Invitation sent to ${inviteEmail}`);
    };

    const handleRemoveMember = async (id: string) => {
        if (id === currentUser?.id) {
            showToast("You cannot remove yourself", 'error');
            return;
        }
        if (!confirm("Are you sure you want to remove this member?")) return;
        
        await db.deleteMember(id);
        const updatedTeam = await db.getTeam();
        setTeam(updatedTeam);
        
        await db.addAuditLog({
            id: Date.now().toString(),
            userId: currentUser?.id || 'sys',
            userName: currentUser?.name || 'System',
            action: 'DELETE',
            details: `Removed team member with ID ${id}`,
            timestamp: Date.now()
        });
        setLogs(await db.getAuditLogs());
        showToast("Member removed from workspace");
        setActionMenuId(null);
    };

    const handleSaveWorkspace = async () => {
        if (!workspace) return;
        setIsSaving(true);
        await db.updateWorkspace(workspace);
        await db.addAuditLog({
            id: Date.now().toString(),
            userId: currentUser?.id || 'sys',
            userName: currentUser?.name || 'System',
            action: 'EDIT',
            details: 'Updated workspace configuration',
            timestamp: Date.now()
        });
        setLogs(await db.getAuditLogs());
        setTimeout(() => {
            setIsSaving(false);
            showToast("Workspace settings applied");
        }, 600);
    };

    const handleSaveSSO = async () => {
        setIsSaving(true);
        await new Promise(r => setTimeout(r, 800)); // Simulate API Call
        await db.addAuditLog({
            id: Date.now().toString(),
            userId: currentUser?.id || 'sys',
            userName: currentUser?.name || 'System',
            action: 'EDIT',
            details: `Updated SSO configuration (${ssoProvider})`,
            timestamp: Date.now()
        });
        setLogs(await db.getAuditLogs());
        setIsSaving(false);
        showToast("SSO Configuration Saved");
    };

    // Navigation Items Definition for Search Filtering
    const generalItems = [
        { id: 'profile', label: 'Personal Profile', icon: <UserIcon className="w-4 h-4" /> },
        { id: 'workspace', label: 'Workspace & Brand', icon: <Globe className="w-4 h-4" /> },
        { id: 'team', label: 'Team Management', icon: <Users className="w-4 h-4" /> },
        { id: 'integrations', label: 'Integrations', icon: <Database className="w-4 h-4" /> },
    ];
    
    const complianceItems = [
        { id: 'security', label: 'Security & Privacy', icon: <Shield className="w-4 h-4" /> },
        { id: 'usage', label: 'Usage & Billing', icon: <BarChart3 className="w-4 h-4" /> },
        { id: 'audit', label: 'Audit Logs', icon: <History className="w-4 h-4" /> },
    ];

    const filteredGeneral = generalItems.filter(item => item.label.toLowerCase().includes(searchQuery.toLowerCase()));
    const filteredCompliance = complianceItems.filter(item => item.label.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <div className="flex h-full bg-slate-50 dark:bg-slate-950 overflow-hidden animate-in fade-in duration-500 relative">
            
            {/* Toast Notification */}
            {toast && (
                <div className={`fixed top-6 right-6 z-[200] px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-right duration-300 ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
                    {toast.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    <span className="font-bold">{toast.message}</span>
                </div>
            )}

            {/* Sub-navigation */}
            <nav className="w-64 border-r border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/30 flex flex-col p-4 overflow-y-auto">
                <div className="mb-6 px-2">
                    <h1 className="text-xl font-display font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <SettingsIcon className="w-5 h-5 text-blue-600" /> Settings
                    </h1>
                    <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-bold">Enterprise Control</p>
                </div>

                 {/* Search Bar */}
                <div className="mb-6 px-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Search settings..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white placeholder:text-slate-400"
                        />
                    </div>
                </div>

                <div className="space-y-1">
                    {filteredGeneral.map(item => (
                        <SettingsNavItem 
                            key={item.id}
                            active={activeTab === item.id} 
                            onClick={() => setActiveTab(item.id as SettingsTab)} 
                            icon={item.icon} 
                            label={item.label} 
                        />
                    ))}
                    
                    {filteredCompliance.length > 0 && (
                        <div className="py-4 px-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                {searchQuery ? 'Compliance Results' : 'Compliance'}
                            </span>
                        </div>
                    )}

                    {filteredCompliance.map(item => (
                         <SettingsNavItem 
                            key={item.id}
                            active={activeTab === item.id} 
                            onClick={() => setActiveTab(item.id as SettingsTab)} 
                            icon={item.icon} 
                            label={item.label} 
                        />
                    ))}

                    {filteredGeneral.length === 0 && filteredCompliance.length === 0 && (
                        <div className="p-4 text-center text-slate-400 text-xs">
                            No settings found.
                        </div>
                    )}
                </div>
            </nav>

            {/* Content Area */}
            <main className="flex-1 overflow-y-auto custom-scrollbar p-8 md:p-12">
                <div className="max-w-4xl mx-auto space-y-12">
                    
                    {activeTab === 'profile' && (
                        <section className="space-y-8 animate-in slide-in-from-bottom-2 duration-300">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Profile</h2>
                                <p className="text-slate-500">Manage your personal information and preferences.</p>
                            </div>

                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm p-8 space-y-6">
                                <div className="flex items-center gap-6 pb-6 border-b border-slate-100 dark:border-white/5">
                                    <div className="relative group">
                                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center text-white text-3xl font-bold shadow-xl border-4 border-white dark:border-slate-800">
                                            {profileName.charAt(0)}
                                        </div>
                                        <button className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                            <RefreshCw className="w-6 h-6" />
                                        </button>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">{profileName}</h3>
                                        <p className="text-slate-500 text-sm italic">Strategic Operations Manager • Level 4 Clearance</p>
                                        <div className="mt-4 flex gap-2">
                                            <button className="px-4 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Change Photo</button>
                                            <button className="px-4 py-1.5 rounded-lg border border-red-200 dark:border-red-900/30 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors">Remove</button>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
                                        <input 
                                            value={profileName} 
                                            onChange={(e) => setProfileName(e.target.value)}
                                            className="w-full border rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white" 
                                        />
                                    </div>
                                    <FormField label="Email Address" value={currentUser?.email || ''} readOnly />
                                    <FormField label="Timezone" value="EST (UTC-5:00)" />
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">AI Persona</label>
                                        <select 
                                            value={profilePersona}
                                            onChange={(e) => setProfilePersona(e.target.value)}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        >
                                            <option>Strategic Advisor (Concise, High-level)</option>
                                            <option>Deep Analyst (Data-heavy, Detailed)</option>
                                            <option>Creative Partner (Visual-first, Inspiring)</option>
                                            <option>Proofreader (Grammar & Flow focus)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-slate-100 dark:border-white/5 flex justify-end">
                                    <button 
                                        onClick={handleUpdateProfile}
                                        disabled={isSaving}
                                        className="px-8 py-3 bg-blue-900 hover:bg-blue-800 text-white rounded-xl font-bold shadow-lg shadow-blue-900/20 active:scale-95 transition-all flex items-center gap-2"
                                    >
                                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                        Update Profile
                                    </button>
                                </div>
                            </div>
                        </section>
                    )}

                    {activeTab === 'workspace' && (
                        <section className="space-y-8 animate-in slide-in-from-bottom-2 duration-300">
                            <div className="flex justify-between items-end">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Workspace Configuration</h2>
                                    <p className="text-slate-500">Define your organization's global identity and behavior.</p>
                                </div>
                                <div className="px-3 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-900 dark:text-blue-200 rounded-full text-[10px] font-bold uppercase tracking-widest border border-blue-200 dark:border-blue-800">
                                    {workspace?.plan} PLAN
                                </div>
                            </div>

                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm p-8 space-y-8">
                                <div className="space-y-4">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <Globe className="w-4 h-4" /> General Settings
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Workspace Name</label>
                                            <input 
                                                value={workspace?.name || ''} 
                                                onChange={e => setWorkspace(prev => prev ? {...prev, name: e.target.value} : null)}
                                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Workspace ID</label>
                                            <input value="ops-strategic-hq-2024" readOnly className="w-full bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm text-slate-400 outline-none font-mono" />
                                        </div>
                                    </div>
                                </div>

                                <hr className="border-slate-100 dark:border-white/5" />

                                <BrandKitEditor 
                                    onClose={() => {}} 
                                    onUpdate={(kit) => setWorkspace(prev => prev ? {...prev, brandKit: kit} : null)} 
                                />

                                <div className="pt-6 border-t border-slate-100 dark:border-white/5 flex justify-end gap-3">
                                    <button 
                                        onClick={handleSaveWorkspace}
                                        disabled={isSaving}
                                        className="px-8 py-3 bg-blue-900 hover:bg-blue-800 text-white rounded-xl font-bold shadow-lg shadow-blue-900/20 active:scale-95 transition-all flex items-center gap-2"
                                    >
                                        {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                        Apply Workspace Changes
                                    </button>
                                </div>
                            </div>
                        </section>
                    )}

                    {activeTab === 'team' && (
                        <section className="space-y-8 animate-in slide-in-from-bottom-2 duration-300">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Team Management</h2>
                                    <p className="text-slate-500">Collaborate with your department and manage access.</p>
                                </div>
                                <button 
                                    onClick={() => setShowInviteModal(true)}
                                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-600/20 flex items-center gap-2"
                                >
                                    <Plus className="w-4 h-4" /> Invite Member
                                </button>
                            </div>

                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm overflow-visible">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-white/10">
                                        <tr>
                                            <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Member</th>
                                            <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Role</th>
                                            <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                                            <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                        {team.map(m => (
                                            <tr key={m.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold">{m.name.charAt(0)}</div>
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-bold text-slate-900 dark:text-white">{m.name}</span>
                                                            <span className="text-[10px] text-slate-500 font-mono tracking-tight">{m.email}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-tighter ${m.role === 'ADMIN' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                                                        {m.role}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-1.5">
                                                        <div className={`w-1.5 h-1.5 rounded-full ${m.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-orange-500'}`} />
                                                        <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{m.status}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right relative">
                                                    <button 
                                                        onClick={() => setActionMenuId(actionMenuId === m.id ? null : m.id)}
                                                        className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                                                    >
                                                        <MoreVertical className="w-4 h-4" />
                                                    </button>
                                                    {actionMenuId === m.id && (
                                                        <div className="absolute top-full right-6 z-50 mt-1 w-44 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-2">
                                                            <button className="px-4 py-2.5 text-left text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-2">
                                                                Edit Permissions
                                                            </button>
                                                            <button 
                                                                onClick={() => handleRemoveMember(m.id)}
                                                                className="px-4 py-2.5 text-left text-xs font-bold hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 flex items-center gap-2 border-t border-slate-100 dark:border-white/5"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" /> Remove Member
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    )}

                    {activeTab === 'integrations' && (
                        <section className="space-y-8 animate-in slide-in-from-bottom-2 duration-300">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Integrations</h2>
                                <p className="text-slate-500">Connect InfoGenius with your existing enterprise toolchain for automated data flows.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <IntegrationCard 
                                    icon={<Slack className="text-[#4A154B]" />} 
                                    name="Slack" 
                                    desc="Send automated insight reports and mentions to specific channels." 
                                    connected={true}
                                />
                                <IntegrationCard 
                                    icon={<Github className="text-slate-900 dark:text-white" />} 
                                    name="GitHub" 
                                    desc="Archive generated SVG dashboards and assets directly into repositories." 
                                    connected={false}
                                />
                                <IntegrationCard 
                                    icon={<Figma className="text-[#F24E1E]" />} 
                                    name="Figma" 
                                    desc="Sync your Brand Kit and exported visuals directly to Figma design files." 
                                    connected={false}
                                />
                                <IntegrationCard 
                                    icon={<Database className="text-blue-500" />} 
                                    name="Salesforce" 
                                    desc="Import real-time CRM metrics for grounded visual reporting." 
                                    connected={false}
                                />
                            </div>

                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 rounded-2xl p-6 flex items-start gap-4">
                                <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg">
                                    <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-blue-900 dark:text-blue-200">Custom Webhooks</h4>
                                    <p className="text-sm text-blue-800/70 dark:text-blue-300/60 mt-1">Need a proprietary integration? Our enterprise API supports incoming and outgoing webhooks for custom data pipelines.</p>
                                    <button className="mt-3 text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline">View Documentation</button>
                                </div>
                            </div>
                        </section>
                    )}

                    {activeTab === 'security' && (
                        <section className="space-y-8 animate-in slide-in-from-bottom-2 duration-300">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Security & Privacy</h2>
                                <p className="text-slate-500">Manage enterprise authentication protocols and access controls.</p>
                            </div>

                            {/* Authentication Settings */}
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm p-8 space-y-8">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                            <Lock className="w-5 h-5 text-blue-600" /> Single Sign-On (SSO)
                                        </h3>
                                        <p className="text-sm text-slate-500 mt-1">Allow team members to log in using your corporate identity provider.</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" checked={ssoEnabled} onChange={() => setSsoEnabled(!ssoEnabled)} className="sr-only peer" />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>

                                {ssoEnabled && (
                                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700 space-y-6 animate-in fade-in slide-in-from-top-2">
                                        <div className="grid grid-cols-2 gap-4">
                                            <button
                                                onClick={() => setSsoProvider('OIDC')}
                                                className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${ssoProvider === 'OIDC' ? 'bg-white dark:bg-slate-800 border-blue-500 ring-1 ring-blue-500 text-blue-700 dark:text-blue-300' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-white dark:hover:bg-slate-800'}`}
                                            >
                                                <Globe className="w-6 h-6" />
                                                <span className="font-bold text-sm">OpenID Connect (OIDC)</span>
                                            </button>
                                            <button
                                                onClick={() => setSsoProvider('SAML')}
                                                className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${ssoProvider === 'SAML' ? 'bg-white dark:bg-slate-800 border-blue-500 ring-1 ring-blue-500 text-blue-700 dark:text-blue-300' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-white dark:hover:bg-slate-800'}`}
                                            >
                                                <Shield className="w-6 h-6" />
                                                <span className="font-bold text-sm">SAML 2.0</span>
                                            </button>
                                        </div>

                                        {ssoProvider === 'OIDC' ? (
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Identity Provider Issuer URL</label>
                                                    <input placeholder="https://auth.company.com" className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white" />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Client ID</label>
                                                        <input type="text" className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Client Secret</label>
                                                        <div className="relative">
                                                            <input type="password" value="••••••••••••" readOnly className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white" />
                                                            <Key className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">IdP SSO URL</label>
                                                    <input placeholder="https://idp.company.com/sso" className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">IdP Entity ID</label>
                                                    <input placeholder="https://idp.company.com/metadata" className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">X.509 Certificate</label>
                                                    <textarea className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 h-24 font-mono text-xs text-slate-900 dark:text-white resize-none" placeholder="-----BEGIN CERTIFICATE-----..." />
                                                </div>
                                            </div>
                                        )}
                                        
                                        <div className="flex justify-end pt-2">
                                            <button 
                                                onClick={handleSaveSSO}
                                                disabled={isSaving}
                                                className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-md hover:bg-blue-700 transition-colors flex items-center gap-2"
                                            >
                                                 {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                                Save SSO Configuration
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <hr className="border-slate-100 dark:border-white/5" />

                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                            <Smartphone className="w-5 h-5 text-emerald-600" /> Multi-Factor Authentication
                                        </h3>
                                        <p className="text-sm text-slate-500 mt-1">Require 2FA for all members of this workspace.</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" checked={enforce2FA} onChange={() => setEnforce2FA(!enforce2FA)} className="sr-only peer" />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                                    </label>
                                </div>
                                
                                <hr className="border-slate-100 dark:border-white/5" />

                                <div>
                                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Active Sessions</h3>
                                    <div className="space-y-3">
                                         <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-100 dark:border-white/5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center border border-slate-200 dark:border-slate-600">
                                                    <Globe className="w-4 h-4 text-blue-600" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900 dark:text-white">Chrome on macOS <span className="text-emerald-500 ml-2 text-[10px] uppercase font-bold tracking-wider">Current</span></p>
                                                    <p className="text-xs text-slate-500">192.168.1.42 • New York, USA</p>
                                                </div>
                                            </div>
                                            <button className="text-xs font-bold text-slate-400 hover:text-red-500">Revoke</button>
                                         </div>
                                         <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-100 dark:border-white/5 opacity-60">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center border border-slate-200 dark:border-slate-600">
                                                    <Smartphone className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900 dark:text-white">Safari on iPhone 14 Pro</p>
                                                    <p className="text-xs text-slate-500">10.0.0.1 • 2 hours ago</p>
                                                </div>
                                            </div>
                                            <button className="text-xs font-bold text-slate-400 hover:text-red-500">Revoke</button>
                                         </div>
                                    </div>
                                </div>
                            </div>
                        </section>
                    )}

                    {activeTab === 'audit' && (
                        <section className="space-y-8 animate-in slide-in-from-bottom-2 duration-300">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Audit Logs</h2>
                                <p className="text-slate-500">Traceable history of all organizational AI interactions and platform activity.</p>
                            </div>

                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden">
                                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-white/10 flex justify-between items-center">
                                    <div className="relative flex-1 max-w-sm">
                                        <Plus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rotate-45" />
                                        <input placeholder="Filter events..." className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-4 py-2 text-xs outline-none" />
                                    </div>
                                    <button className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
                                        <History className="w-3.5 h-3.5" /> Full Export (CSV)
                                    </button>
                                </div>
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 dark:bg-slate-800/30 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200 dark:border-white/10">
                                        <tr>
                                            <th className="px-6 py-3">Event</th>
                                            <th className="px-6 py-3">Actor</th>
                                            <th className="px-6 py-3">Timestamp</th>
                                            <th className="px-6 py-3">Outcome</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                        {logs.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">No recent platform events recorded.</td>
                                            </tr>
                                        ) : (
                                            logs.map(log => (
                                                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                                                            <span className="font-medium text-slate-900 dark:text-slate-200">{log.action}</span>
                                                        </div>
                                                        <p className="text-[10px] text-slate-400 truncate max-w-[200px] mt-0.5">{log.details}</p>
                                                    </td>
                                                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{log.userName}</td>
                                                    <td className="px-6 py-4 text-slate-500 text-[10px] font-mono">{new Date(log.timestamp).toLocaleString()}</td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[10px] uppercase">SUCCESS</span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    )}

                    {activeTab === 'usage' && (
                        <section className="space-y-8 animate-in slide-in-from-bottom-2 duration-300">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Usage & Billing</h2>
                                <p className="text-slate-500">Monitor your consumption metrics and manage subscriptions.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <UsageCard icon={<BarChart3 className="text-blue-600" />} label="Token Usage" value="1.2M / 5M" sub="24% of quota" color="blue" />
                                <UsageCard icon={<Plus className="text-emerald-600" />} label="AI Generations" value="482" sub="Unlimited" color="emerald" />
                                <UsageCard icon={<Database className="text-orange-600" />} label="Storage" value="2.4 GB" sub="24% of 10GB" color="orange" />
                            </div>

                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm p-8 flex flex-col md:flex-row gap-8 items-center">
                                <div className="flex-1 space-y-4">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-900 dark:text-blue-300 rounded-full text-[10px] font-bold uppercase tracking-widest">Enterprise Plan</div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Scale your research operations</h3>
                                    <p className="text-sm text-slate-500 leading-relaxed">Your current Enterprise plan includes unlimited search grounding, priority rendering, and advanced multi-modal canvas tools.</p>
                                    <ul className="grid grid-cols-2 gap-y-2 gap-x-4">
                                        <li className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400"><Check className="w-3 h-3 text-emerald-500" /> SSO / SAML</li>
                                        <li className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400"><Check className="w-3 h-3 text-emerald-500" /> Dedicated API Quota</li>
                                        <li className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400"><Check className="w-3 h-3 text-emerald-500" /> Custom Training</li>
                                        <li className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400"><Check className="w-3 h-3 text-emerald-500" /> Export to SVG/PDF</li>
                                    </ul>
                                </div>
                                <div className="w-full md:w-64 bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 text-center border border-slate-100 dark:border-white/5 shadow-inner">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Next Billing Date</p>
                                    <p className="text-lg font-bold text-slate-900 dark:text-white mb-4">Oct 24, 2024</p>
                                    <button className="w-full py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold shadow-sm hover:shadow-md transition-all">
                                        Manage Billing
                                    </button>
                                </div>
                            </div>
                        </section>
                    )}

                </div>
            </main>

            {/* Invite Modal */}
            {showInviteModal && (
                <div className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in duration-300">
                        <div className="p-8 border-b border-slate-100 dark:border-white/5 flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Invite Team Member</h3>
                                <p className="text-sm text-slate-500 mt-1">Invited people will receive a secure access link via email.</p>
                            </div>
                            <button onClick={() => setShowInviteModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleInviteMember} className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input 
                                        required
                                        type="email"
                                        placeholder="colleague@enterprise.com"
                                        value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Workspace Role</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {['VIEWER', 'EDITOR', 'ADMIN'].map(role => (
                                        <button 
                                            key={role}
                                            type="button"
                                            onClick={() => setInviteRole(role as any)}
                                            className={`py-2 px-3 rounded-xl border text-[10px] font-bold transition-all ${inviteRole === role ? 'bg-blue-900 text-white border-blue-900 shadow-md ring-2 ring-blue-500/20' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100'}`}
                                        >
                                            {role}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button 
                                    type="button"
                                    onClick={() => setShowInviteModal(false)}
                                    className="flex-1 py-3 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold rounded-xl hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    disabled={isInviting || !inviteEmail}
                                    className="flex-1 py-3 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isInviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                    Send Invitation
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Sub-components ---

const SettingsNavItem: React.FC<{ active: boolean, onClick: () => void, icon: React.ReactNode, label: string }> = ({ active, onClick, icon, label }) => (
    <button 
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${active ? 'bg-blue-50 text-blue-900 dark:bg-blue-900/40 dark:text-blue-200 shadow-sm ring-1 ring-blue-500/10' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
    >
        <span className={`${active ? 'text-blue-600' : 'text-slate-400'}`}>{icon}</span>
        {label}
        {active && <ChevronRight className="ml-auto w-3.5 h-3.5 opacity-50" />}
    </button>
);

const FormField = ({ label, value, readOnly = false }: { label: string, value: string, readOnly?: boolean }) => (
    <div className="space-y-2">
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</label>
        <input 
            value={value} 
            readOnly={readOnly}
            className={`w-full border rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all ${readOnly ? 'bg-slate-100 dark:bg-slate-800/50 text-slate-400 border-slate-200 dark:border-slate-700' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white'}`} 
        />
    </div>
);

const IntegrationCard = ({ icon, name, desc, connected }: { icon: React.ReactNode, name: string, desc: string, connected: boolean }) => (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col">
        <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-xl shadow-inner">
                {icon}
            </div>
            {connected ? (
                <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold rounded-lg flex items-center gap-1">
                    <Check className="w-3 h-3" /> ACTIVE
                </span>
            ) : (
                <button className="px-3 py-1 bg-blue-900 hover:bg-blue-800 text-white text-[10px] font-bold rounded-lg transition-colors">
                    CONNECT
                </button>
            )}
        </div>
        <h4 className="font-bold text-slate-900 dark:text-white">{name}</h4>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed flex-1">{desc}</p>
        <div className="mt-4 pt-4 border-t border-slate-50 dark:border-white/5 flex justify-end">
            <button className="text-[10px] font-bold text-slate-400 hover:text-blue-600 transition-colors flex items-center gap-1">
                Configure <ExternalLink className="w-3 h-3" />
            </button>
        </div>
    </div>
);

const UsageCard = ({ icon, label, value, sub, color }: { icon: React.ReactNode, label: string, value: string, sub: string, color: string }) => {
    const colorClasses: Record<string, string> = {
        blue: 'border-blue-200 dark:border-blue-900/30',
        emerald: 'border-emerald-200 dark:border-emerald-900/30',
        orange: 'border-orange-200 dark:border-orange-900/30'
    };
    return (
        <div className={`bg-white dark:bg-slate-900 p-6 rounded-2xl border ${colorClasses[color]} shadow-sm`}>
            <div className="flex justify-between items-start mb-4">
                <div className={`p-2 rounded-lg bg-slate-50 dark:bg-slate-800`}>{icon}</div>
                <div className="flex h-1.5 w-12 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full bg-blue-500 w-[40%]`} />
                </div>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">{value}</p>
            <p className="text-[10px] text-slate-500 font-medium mt-1">{sub}</p>
        </div>
    );
};

export default Settings;