import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Building2, Users, MessageSquare, Heart, Trash2,
  CheckCircle, XCircle, Clock, LayoutDashboard,
  ArrowUpRight, Plus, MapPin, Calendar, User as UserIcon,
  ShieldCheck, Loader2, UserPlus, ShieldAlert, MoreVertical, Sparkles,
  Database, Search, Download, RefreshCw, Edit3, Save, FileJson, Table, Settings, Handshake, ArrowRightLeft, Info,
  History as HistoryIcon, FileBadge, Printer, Key as KeyIcon
} from 'lucide-react';
import { Property, Inquiry, Profile } from '@/types/property';
import { cn, formatCurrency } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Link, useNavigate, useLocation } from 'react-router-dom';

export default function Dashboard() {
  const { user, isAdmin, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [myProperties, setMyProperties] = useState<Property[]>([]);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [allTransactions, setAllTransactions] = useState<any[]>([]);
  const [allProperties, setAllProperties] = useState<Property[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [stats, setStats] = useState({ users: 0, properties: 0, inquiries: 0 });
  const [loading, setLoading] = useState(true);

  // Table Exploration State
  const [selectedTable, setSelectedTable] = useState('properties');
  const [tableData, setTableData] = useState<any[]>([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingRow, setEditingRow] = useState<any | null>(null);
  const [selectedCertificate, setSelectedCertificate] = useState<any | null>(null);

  // Tabs Management
  const searchParams = new URLSearchParams(location.search);
  const initialTab = searchParams.get('tab') || 'overview';
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    const tab = new URLSearchParams(location.search).get('tab') || 'overview';
    if (tab !== activeTab) setActiveTab(tab);
  }, [location.search, activeTab]);

  const handleTabChange = (val: string) => {
    setActiveTab(val);
    navigate(`/dashboard?tab=${val}`, { replace: true });
  };

  useEffect(() => {
    const validUserTabs = ['overview', 'portfolio', 'leads', 'sale_history', 'rent_history', 'settings'];
    const validAdminTabs = ['overview', 'sales', 'rentals', 'inquiries', 'sale_history', 'rent_history', 'users', 'database'];
    const validTabs = isAdmin ? validAdminTabs : validUserTabs;

    if (!validTabs.includes(activeTab)) {
      console.warn(`[Dashboard] Tab "${activeTab}" invalid for ${isAdmin ? 'admin' : 'user'} role. Resetting to overview.`);
      handleTabChange('overview');
    }
  }, [isAdmin, activeTab]);

  const userStats = useMemo(() => {
    if (!user) return [];
    const curName = (user?.fullName || '').toLowerCase().trim();

    const selling = myProperties?.filter(p =>
      p.status !== 'sold' &&
      (p.posted_by === user.id || (p.profiles?.full_name || '').toLowerCase().trim() === curName)
    )?.length || 0;

    const acquired = myProperties?.filter(p =>
      p.status === 'sold' &&
      inquiries?.some(i => i.property_id === p.id && i.is_sold_to_me)
    )?.length || 0;

    const liquidated = myProperties?.filter(p =>
      p.status === 'sold' &&
      (p.posted_by === user.id || (p.profiles?.full_name || '').toLowerCase().trim() === curName) &&
      !inquiries?.some(i => i.property_id === p.id && i.is_sold_to_me)
    )?.length || 0;

    return [
      { label: 'Selling Inventory', count: selling, color: 'text-primary', bg: 'bg-primary/5', icon: Building2 },
      { label: 'Acquired Assets', count: acquired, color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CheckCircle },
      { label: 'Liquidated Sales', count: liquidated, color: 'text-slate-900', bg: 'bg-slate-50', icon: Clock },
      { label: 'Direct Inquiries', count: inquiries?.length || 0, color: 'text-indigo-600', bg: 'bg-indigo-50', icon: Sparkles },
    ];
  }, [myProperties, inquiries, user]);

  // Profile State
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileForm, setProfileForm] = useState({ fullName: '', phone: '', address: '', bio: '' });
  const [updatingProfile, setUpdatingProfile] = useState(false);

  const TABLES = [
    { name: 'properties', label: 'Assets', icon: Building2 },
    { name: 'profiles', label: 'Identities', icon: Users },
    { name: 'inquiries', label: 'Leads', icon: MessageSquare },
    { name: 'user_roles', label: 'Security Roles', icon: ShieldCheck },
    { name: 'favorites', label: 'Market Interest', icon: Heart },
    { name: 'property_images', label: 'Asset Media', icon: Sparkles },
  ];

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/login');
      return;
    }

    const loadData = async () => {
      setLoading(true);
      const timeoutId = setTimeout(() => setLoading(false), 5000);

      try {
        // 0. Find all alternate IDs for this name (Demo resilience - Bypasses RLS)
        let { data: altProfiles } = await (supabase.rpc as any)('get_profiles_by_name_rpc', {
          p_name: user.fullName
        });

        // Handle JSONB return from RPC
        const altProfilesArr = Array.isArray(altProfiles) ? altProfiles : [];
        const myIds = new Set([user.id, ...(altProfilesArr.map((p: any) => p.user_id) || [])]);
        const myIdsArr = Array.from(myIds);

        // 1. Fetch own properties (ULTRA RPC - Handles name-based recovery and bypasses RLS)
        let { data: listed, error: listErr } = await (supabase.rpc as any)('get_user_properties_ultra_rpc', {
          p_user_id: user.id,
          p_user_name: user.fullName
        });

        if (listErr) {
          console.warn('[Dashboard] Ultra Properties RPC failed, trying local session select:', listErr.message);
          const { data: basicList } = await supabase
            .from('properties')
            .select('*, property_images(*)')
            .in('posted_by', myIdsArr);
          listed = basicList;
        }

        // 2. Fetch Inquiries (ULTRA RPC - Handles name-based recovery)
        let { data: inqData, error: inqErr } = await (supabase.rpc as any)('get_user_leads_ultra_rpc', {
          p_user_id: user.id,
          p_user_name: user.fullName
        });

        if (inqErr) {
          console.warn('[Dashboard] Ultra Leads RPC failed, trying basic RPC:', inqErr.message);
          const { data: basicInq } = await (supabase.rpc as any)('get_user_leads_rpc', { p_user_id: user.id });
          inqData = basicInq;
        }

        // 3. GLOBAL TRANSACTION RECOVERY: Identify properties I've acquired or are sold to others
        const allLeads = (inqData || []);

        // Match specific inquiry successes to the current user (ID or Name)
        const curNameNormal = (user?.fullName || '').toLowerCase().trim();
        const acquiredIds = new Set<string>();
        const soldToOtherIds = new Set<string>();

        // Use the RPC results which already performed deep recovery
        allLeads.forEach((i: any) => {
          if (i.is_sold_to_me) acquiredIds.add(i.property_id);
          if (i.is_sold_to_other) soldToOtherIds.add(i.property_id);
        });

        // Fallback sync for edge cases where RPC might have missed something (ID based only)
        // myIds already declared above at line 95

        // Sync local property state
        let myCombinedProps = [...(listed || [])];
        const recoveredAcquiredIds = Array.from(acquiredIds);
        if (recoveredAcquiredIds.length > 0) {
          const { data: acquiredProps } = await supabase
            .from('properties')
            .select('*, property_images(*)')
            .in('id', recoveredAcquiredIds);

          if (acquiredProps) {
            const existingIds = new Set(myCombinedProps.map(p => p.id));
            acquiredProps.forEach(p => {
              if (!existingIds.has(p.id)) {
                // Attach images if they were fetched
                myCombinedProps.push(p);
              }
            });
          }
        }
        setMyProperties(myCombinedProps.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()));

        // 2. Fetch Profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (profileData) {
          const p = profileData as any;
          setProfile(p);
          setProfileForm({
            fullName: p.full_name || '',
            phone: p.phone || '',
            address: p.address || '',
            bio: p.bio || ''
          });
        }

        // 3. Fetch Inquiries (ULTRA RPC - Matches by ID and Name)
        // [Already fetched in Step 1/2 above as inqData]

        if (inqData) {
          let finalInquiries = [...(inqData || [])];

          // 3b. Admin: Fetch ALL inquiries for global oversight
          if (isAdmin) {
            const { data: globalInq, error: gInqErr } = await supabase
              .from('inquiries')
              .select('*, properties(*)')
              .order('created_at', { ascending: false });

            if (!gInqErr && globalInq) {
              finalInquiries = globalInq;
            } else {
              const { data: rpcInq } = await (supabase.rpc as any)('get_all_inquiries_rpc');
              if (rpcInq) finalInquiries = rpcInq;
            }

            // Also populate allTransactions for History tab using global data
            const closedInqs = finalInquiries.filter((i: any) => ['approved', 'closed'].includes(i.status));
            setAllTransactions(closedInqs.map((t: any) => ({
              ...t,
              buyer_name: t.user_full_name || 'Verified Buyer',
              seller_name: t.property_owner_name || 'Verified Seller'
            })));
          }

          // 3c. Deep Property Status Sync
          const allPropIds = Array.from(new Set(finalInquiries.map((i: any) => i.property_id))).filter(Boolean) as string[];
          let propStatusMap: Record<string, string> = {};
          let pMap: Record<string, string> = {};

          if (allPropIds.length > 0) {
            const { data: leadProps } = await supabase.from('properties').select('id, status').in('id', allPropIds);
            propStatusMap = Object.fromEntries(leadProps?.map(p => [p.id, p.status]) || []);
          }

          const userIds = new Set(finalInquiries.map((i: any) => i.user_id));
          finalInquiries.forEach((i: any) => {
            if (i.properties?.posted_by) userIds.add(i.properties.posted_by);
          });

          const userIdsArr = Array.from(userIds) as string[];
          if (userIdsArr.length > 0) {
            const { data: profiles } = await supabase
              .from('profiles')
              .select('user_id, full_name')
              .in('user_id', userIdsArr);
            pMap = Object.fromEntries(profiles?.map(p => [p.user_id, p.full_name]) || []);
          }

          // Inject current user into map if missing
          if (user.id && user.fullName) pMap[user.id] = user.fullName;

          setInquiries(finalInquiries.map((i: any) => {
            const buyer = pMap[i.user_id] || i.user_full_name || 'Verified Buyer';
            const seller = pMap[i.properties?.posted_by] || i.property_owner_name || 'Verified Seller';

            // Mark as approved if THIS property is in our acquired set
            const isDefinitivelyMine = acquiredIds.has(i.property_id);

            return {
              ...i,
              user_full_name: buyer,
              buyer_name: buyer,
              seller_name: seller,
              status: i.is_sold_to_me ? 'approved' : i.status,
              isRecoveredOwnership: i.is_sold_to_me,
              isSoldToOther: i.is_sold_to_other,
              properties: { ...(i.properties || {}), status: propStatusMap?.[i.property_id] || i.properties?.status || 'active' }
            };
          }));
        }

        // 4. Admin: Global Special Access
        if (isAdmin) {
          try {
            // Parallelize global admin fetches
            const [transRes, propsRes, imagesRes, usersRes] = await Promise.all([
              supabase.from('inquiries').select('*, properties(title, posted_by)').in('status', ['approved', 'closed']),
              supabase.from('properties').select('*').order('created_at', { ascending: false }),
              supabase.from('property_images').select('*'),
              supabase.from('profiles').select('*, user_roles(role)')
            ]);

            // Handling Transactions
            let allTrans = transRes.data;
            if (allTrans) {
              const uids = new Set<string>();
              allTrans.forEach((t: any) => {
                uids.add(t.user_id);
                if (t.properties?.posted_by) uids.add(t.properties.posted_by);
              });
              const { data: profs } = await supabase.from('profiles').select('user_id, full_name').in('user_id', Array.from(uids));
              const pMap = Object.fromEntries(profs?.map(p => [p.user_id, p.full_name]) || []);
              if (user.id) pMap[user.id] = user.fullName;

              setAllTransactions(allTrans.map((t: any) => ({
                ...t,
                buyer_name: pMap[t.user_id] || 'Verified Buyer',
                seller_name: pMap[t.properties?.posted_by] || 'Verified Seller'
              })));
            }

            // Handling Properties & Images
            let globalProps = propsRes.data || [];
            if (propsRes.error || !propsRes.data) {
              const { data: rpcProps } = await (supabase.rpc as any)('get_all_properties_rpc');
              globalProps = rpcProps || [];
            }

            let allImages = imagesRes.data || [];
            if (imagesRes.error || !imagesRes.data) {
              const { data: rpcImgs } = await (supabase.rpc as any)('get_all_property_images_rpc');
              allImages = rpcImgs || [];
            }

            const imgMap: Record<string, any[]> = {};
            allImages.forEach(img => {
              if (!imgMap[img.property_id]) imgMap[img.property_id] = [];
              imgMap[img.property_id].push(img);
            });

            const myPropIds = new Set(myCombinedProps.map((p: any) => p.id));
            const mergedProps = [...myCombinedProps, ...globalProps.filter((p: any) => !myPropIds.has(p.id))];

            if (mergedProps.length > 0) {
              const ownerIds = Array.from(new Set(mergedProps.map((p: any) => p.posted_by))) as string[];
              const { data: ownerProfiles } = await supabase.from('profiles').select('user_id, full_name').in('user_id', ownerIds);
              const pNameMap = Object.fromEntries(ownerProfiles?.map(p => [p.user_id, p.full_name]) || []);
              mergedProps.forEach((p: any) => {
                if (!p.property_images) p.property_images = imgMap[p.id] || [];
                if (!p.profiles) p.profiles = { full_name: pNameMap[p.posted_by] || 'Anonymous' };
              });
            }
            setAllProperties(mergedProps);

            // Handling Users
            let dbProfiles = usersRes.data || [];
            if (usersRes.error) {
              const { data: rpcProfs } = await (supabase.rpc as any)('get_all_profiles_rpc');
              dbProfiles = rpcProfs || [];
            }
            setAllUsers(dbProfiles);

          } catch (err) {
            console.error("Global admin fetch failed", err);
            setAllProperties(myCombinedProps);
          }
        }

        // 4. Update Stats (Global) - Parallelized
        const [pc, ic, uc] = await Promise.all([
          supabase.from('properties').select('id', { count: 'exact', head: true }),
          supabase.from('inquiries').select('id', { count: 'exact', head: true }),
          supabase.from('profiles').select('user_id', { count: 'exact', head: true })
        ]);

        setStats({
          users: (uc.count || 0) - (isAdmin ? 1 : 0),
          properties: pc.count || 0,
          inquiries: ic.count || 0
        });
      } catch (err) {
        console.error('Data Fetch Error:', err);
      } finally {
        clearTimeout(timeoutId);
        setLoading(false);
      }
    };
    loadData();
  }, [user?.id, isAdmin, authLoading]);

  // toggleUserRole removed as Agent role is gone

  const updatePropertyStatus = async (id: string, status: string) => {
    if (!isAdmin) {
      toast({ title: "Access Denied", description: "Admin permissions required.", variant: "destructive" });
      return;
    }

    // Try standard update
    let { error } = await supabase.from('properties').update({ status: status as any }).eq('id', id);

    if (error) {
      console.warn('[Dashboard] Primary property update failed due to RLS, deploying RPC override...', error);
      const { error: rpcError } = await (supabase.rpc as any)('update_property_status_rpc', {
        p_property_id: id,
        p_status: status
      });
      if (rpcError) {
        toast({ title: "Update Failed", description: rpcError.message, variant: "destructive" });
        return;
      }
    }

    setAllProperties(prev => prev.map(p => p.id === id ? { ...p, status: status as any } : p));
    toast({ title: `Property ${status}` });
  };

  const deleteProperty = async (id: string) => {
    if (!confirm('Permanent delete?')) return;

    let { error } = await supabase.from('properties').delete().eq('id', id);

    // Fallback if RLS blocks the mock auth accounts
    if (error) {
      console.warn('[Dashboard] Direct delete failed, trying RPC bypass...', error);
      const { error: rpcError } = await (supabase.rpc as any)('delete_property_rpc', {
        p_property_id: id
      });
      if (rpcError) {
        toast({ title: "Delete Failed", description: rpcError.message, variant: "destructive" });
        return;
      }
    }

    setMyProperties(prev => prev.filter(p => p.id !== id));
    setAllProperties(prev => prev.filter(p => p.id !== id));
    toast({ title: "Deleted" });
  };

  const loadTableData = async (tableName: string) => {
    setTableLoading(true);
    try {
      let query = supabase.from(tableName as any).select('*');

      // Only order by created_at if the table is known to have that column
      if (['properties', 'inquiries', 'profiles', 'favorites', 'property_images'].includes(tableName)) {
        query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query.limit(100);
      if (error) throw error;
      setTableData(data || []);
    } catch (err) {
      console.error(`Error loading table ${tableName}:`, err);
      toast({ title: "Database Error", description: `Failed to load ${tableName}`, variant: "destructive" });
    } finally {
      setTableLoading(false);
    }
  };

  const deleteTableRow = async (tableName: string, id: string) => {
    if (!confirm(`Are you sure you want to permanently delete record ${id} from ${tableName}?`)) return;

    try {


      const key = tableName === 'profiles' || tableName === 'user_roles' ? 'user_id' : 'id';
      const { error } = await supabase.from(tableName as any).delete().eq(key, id);
      if (error) throw error;

      setTableData(prev => prev.filter(row => (row.id || row.user_id) !== id));
      toast({ title: "Record Deleted", description: "Successfully removed from database." });
    } catch (err) {
      console.error("Delete error:", err);
      toast({ title: "Action Failed", description: "Database rejected the delete request.", variant: "destructive" });
    }
  };

  const updateTableRow = async (tableName: string, data: any) => {
    const pkName = data.id ? 'id' : (data.user_id ? 'user_id' : Object.keys(data)[0]);
    const pkValue = data[pkName];

    try {


      const { error } = await supabase.from(tableName as any).update(data).eq(pkName, pkValue);
      if (error) throw error;

      setTableData(prev => prev.map(r => (r[pkName] === pkValue ? { ...data } : r)));
      setEditingRow(null);
      toast({ title: "Record Saved", description: "Database updated successfully." });
    } catch (err) {
      console.error("Save error:", err);
      toast({ title: "Save Failed", description: "Check permissions/constraints.", variant: "destructive" });
    }
  };

  const deleteUser = async (userId: string, email: string) => {
    if (email === 'sdcreation613@gmail.com') {
      toast({ title: "Access Denied", description: "Super-admin protection active.", variant: "destructive" });
      return;
    }
    if (!confirm(`Permanently terminate access for ${email}?`)) return;

    try {
      // Direct delete from public tables
      await supabase.from('profiles').delete().eq('user_id', userId);
      await supabase.from('user_roles').delete().eq('user_id', userId);

      setAllUsers(prev => prev.filter(u => (u.user_id || u.id) !== userId));
      toast({ title: "Identity Terminated", description: `${email} has been removed from DB.` });
    } catch (err: any) {
      toast({ title: "Refused", description: err.message, variant: "destructive" });
    }
  };

  const updateUserRole = async (userId: string, email: string, newRole: string) => {
    try {
      // Use the sync_user_role RPC to bypass RLS limitations for mock-auth admins
      const { error } = await (supabase.rpc as any)('sync_user_role', {
        p_user_id: userId,
        p_email: email,
        p_role: newRole
      });

      if (error) throw error;

      setAllUsers(prev => prev.map(u => {
        const uid = u.user_id || u.id;
        if (uid === userId) {
          return { ...u, user_roles: [{ role: newRole }] };
        }
        return u;
      }));

      toast({ title: "Role Modified", description: `${email} is now a ${newRole}.` });
    } catch (err: any) {
      toast({ title: "Sync Failed", description: err.message, variant: "destructive" });
    }
  };

  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setUpdatingProfile(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profileForm.fullName,
          phone: profileForm.phone,
          address: profileForm.address,
          bio: profileForm.bio,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, full_name: profileForm.fullName, phone: profileForm.phone, address: profileForm.address, bio: profileForm.bio } : null);
      toast({ title: "Profile Updated", description: "Your personal details have been saved successfully." });
    } catch (err: any) {
      console.error("Profile update error:", err);
      toast({ title: "Update Failed", description: err.message, variant: "destructive" });
    } finally {
      setUpdatingProfile(false);
    }
  };

  useEffect(() => {
    if (isAdmin) loadTableData(selectedTable);
  }, [selectedTable, isAdmin]);

  if (loading || authLoading) return <div className="min-h-screen bg-background flex flex-col"><div className="flex-1 flex items-center justify-center"><Loader2 className="animate-spin text-primary h-12 w-12" /></div></div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">

      <main className="container max-w-7xl py-10 px-4">
        {/* Modern Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 animate-fade-in group">
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tight text-slate-900 flex items-center gap-3">
              Welcome back, <span className="text-primary italic">{user?.fullName?.split(' ')[0] || 'User'}</span> 👋
              {isAdmin && <Badge className="bg-red-500 text-white border-none font-bold uppercase text-[10px] h-6">Admin</Badge>}
            </h1>
            <p className="text-slate-500 font-medium text-lg">
              Manage your property portfolio and {isAdmin ? 'global requests' : 'inquiries'} efficiently.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-accent rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-1000"></div>
              <Link to="/add-property">
                <Button className="relative h-14 px-8 rounded-2xl bg-slate-900 text-white hover:bg-slate-800 transition-all font-bold text-md flex items-center gap-2">
                  <Plus className="h-5 w-5" /> List New Estate
                </Button>
              </Link>
            </div>
          </div>
        </div>
        {isAdmin ? (
          <Tabs key="admin-tabs" value={activeTab} onValueChange={handleTabChange} className="space-y-10">
            <div className="flex items-center justify-between border-b pb-4">
              <TabsList className="bg-transparent h-auto p-0 gap-8">
                {['overview', 'sales', 'rentals', 'inquiries', 'sale_history', 'rent_history', isAdmin && 'users', isAdmin && 'database'].filter(Boolean).map((tab: any) => (
                  <TabsTrigger
                    key={tab}
                    value={tab}
                    className="capitalize text-slate-500 font-black text-sm tracking-widest pb-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent transition-all"
                  >
                    {(tab || '').toString().replace('_', ' ')}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <TabsContent value="overview" className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
              {/* Admin Bento Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { label: 'Market Velocity', count: stats?.users || 0, trend: '+12%', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
                  { label: 'Registered Members', count: stats?.users || 0, trend: 'Verified', icon: UserPlus, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                  { label: 'Luxury Inventory', count: stats?.properties || 0, trend: '+5%', icon: Building2, color: 'text-primary', bg: 'bg-primary/5' },
                  { label: 'Purchase Commitments', count: inquiries?.filter(i => (i?.message || '').includes('PURCHASE REQUEST') || (i?.message || '').includes('🛑'))?.length || 0, trend: 'High Priority', icon: ShieldCheck, color: 'text-red-600', bg: 'bg-red-50' }
                ].map((s, i) => (
                  <div key={i} className={`p-8 rounded-[2.5rem] bg-white border-2 ${s.label === 'Purchase Commitments' ? 'border-red-100' : 'border-slate-50'} shadow-sm hover:shadow-xl transition-all duration-500 group`}>
                    <div className="flex justify-between items-start mb-6">
                      <div className={`h-14 w-14 rounded-2xl ${s.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <s.icon className={`h-7 w-7 ${s.color}`} />
                      </div>
                      <Badge className={`${s.label === 'Purchase Commitments' ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'} border-none font-bold uppercase text-[9px]`}>{s.trend}</Badge>
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-1">{s.label}</h3>
                      <div className={`text-3xl font-black ${s.label === 'Purchase Commitments' ? 'text-red-600' : 'text-slate-900'}`}>{s.count}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Admin Live Security/Communication Monitor */}
              <div className="p-10 rounded-[3rem] bg-slate-900 border-none text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:rotate-12 transition-transform duration-1000"><ShieldCheck className="h-48 w-48" /></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="h-12 w-12 rounded-xl bg-red-500 flex items-center justify-center animate-pulse"><ShieldAlert className="h-6 w-6 text-white" /></div>
                    <div>
                      <h2 className="text-2xl font-black tracking-tight">Global Communication Monitor</h2>
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">Real-time Oversight Active</p>
                    </div>
                  </div>

                  <div className="space-y-4 max-h-[250px] overflow-y-auto pr-4 scroll-smooth">
                    {inquiries?.length > 0 ? inquiries.slice(0, 10).map((inq, idx) => {
                      const isPurchase = (inq?.message || '').includes('PURCHASE REQUEST') || (inq?.message || '').includes('🛑');
                      return (
                        <div key={inq.id} className={`p-6 rounded-[1.5rem] border ${isPurchase ? 'bg-red-500/10 border-red-500/30' : 'bg-white/5 border-white/10'} flex items-center justify-between hover:bg-white/10 transition-all stagger-fade-in`} style={{ animationDelay: `${idx * 0.1}s` }}>
                          <div className="flex items-center gap-4">
                            <div className={`h-10 w-10 rounded-full flex items-center justify-center border ${isPurchase ? 'bg-red-500/20 border-red-500/40' : 'bg-emerald-500/20 border-emerald-500/30'}`}>
                              {isPurchase ? <ShieldCheck className="h-5 w-5 text-red-400" /> : <UserPlus className="h-5 w-5 text-emerald-400" />}
                            </div>
                            <div>
                              <p className="text-sm font-bold">
                                <span className={isPurchase ? 'text-red-400' : 'text-emerald-400'}>{inq.user_full_name}</span>
                                {isPurchase ? ' is committing to buy ' : ' messaged Admin regarding '}
                                <span className="text-primary-foreground underline underline-offset-4">{inq.properties?.title || 'Property Listing'}</span>
                              </p>
                              <p className="text-[10px] text-white/40 mt-1 font-mono uppercase font-bold tracking-widest">
                                {isPurchase ? '🛑 PRIORITY TRANSACTION 🛑' : `${inq?.created_at ? new Date(inq.created_at).toLocaleTimeString() : 'Recent'} - Secure Link Established`}
                              </p>
                            </div>
                          </div>
                          <Badge className={`${isPurchase ? 'bg-red-500 text-white' : 'bg-emerald-500/10 text-emerald-400'} border-none text-[9px] font-black uppercase tracking-widest`}>
                            {isPurchase ? 'BUY COMMIT' : 'ACTIVE LINK'}
                          </Badge>
                        </div>
                      );
                    }) : (
                      <div className="text-center py-10 text-slate-500 font-bold italic">No active communications detected on the grid.</div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="sales" className="animate-in fade-in slide-in-from-bottom-5 duration-500">
              <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
                <div className="p-8 border-b bg-slate-50/50 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center"><Building2 className="text-emerald-600 h-5 w-5" /></div>
                  <h2 className="text-xl font-black italic">Global Sales <span className="text-primary not-italic">Inventory</span></h2>
                </div>
                <div className="p-6 overflow-x-auto">
                  <table className="w-full">
                    <thead className="text-[10px] font-black uppercase text-slate-400 tracking-widest border-b">
                      <tr>
                        <th className="px-6 py-4 text-left">Property Detail</th>
                        <th className="px-6 py-4 text-left">Listed By</th>
                        <th className="px-6 py-4 text-left">Global Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {allProperties?.filter(p => !p.listing_type || p.listing_type === 'sale').map(p => (
                        <tr key={p?.id || Math.random().toString()} className="group hover:bg-slate-50/80 transition-all">
                          <td className="px-6 py-6 font-display">
                            <div className="flex items-center gap-4">
                              <img src={p?.property_images?.[0]?.image_url || '/placeholder.svg'} className="h-14 w-14 rounded-xl object-cover ring-2 ring-slate-100" />
                              <div>
                                <div className="font-bold text-slate-900 line-clamp-1">{p?.title || 'Unknown Asset'}</div>
                                <div className="text-xs font-bold text-primary italic font-display">{p?.price ? formatCurrency(p.price) : 'Contact'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-6">
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400">{(p?.profiles?.full_name || 'A')[0]}</div>
                              <span className="text-sm font-bold text-slate-600 truncate max-w-[120px]">{p?.profiles?.full_name || 'Anonymous User'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-6">
                            <Badge className={`rounded-xl px-4 py-1 border-none font-black text-[9px] tracking-widest uppercase ${p?.status === 'approved' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : (p?.status === 'sold' ? 'bg-slate-900 text-white' : 'bg-amber-500 text-white shadow-lg shadow-amber-500/20')}`}>
                              {p?.status || 'review'}
                            </Badge>
                          </td>
                          <td className="px-6 py-6 text-right">
                            <div className="flex justify-end gap-2">
                              {(p.status === 'pending' || !p.status) && (
                                <Button size="sm" onClick={() => updatePropertyStatus(p.id, 'approved')} className="bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl px-4 h-9 text-[10px] uppercase tracking-widest">Approve</Button>
                              )}
                              <Button variant="ghost" size="icon" onClick={() => deleteProperty(p.id)} className="h-9 w-9 text-slate-400 hover:text-red-500 rounded-xl hover:bg-red-50 transition-colors"><Trash2 className="h-4 w-4" /></Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="rentals" className="animate-in fade-in slide-in-from-bottom-5 duration-500">
              <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
                <div className="p-8 border-b bg-slate-50/50 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center"><KeyIcon className="text-amber-600 h-5 w-5" /></div>
                  <h2 className="text-xl font-black italic">Global Rental <span className="text-primary not-italic">Inventory</span></h2>
                </div>
                <div className="p-6 overflow-x-auto">
                  <table className="w-full">
                    <thead className="text-[10px] font-black uppercase text-slate-400 tracking-widest border-b">
                      <tr>
                        <th className="px-6 py-4 text-left">Property Detail</th>
                        <th className="px-6 py-4 text-left">Listed By</th>
                        <th className="px-6 py-4 text-left">Global Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {allProperties?.filter(p => p.listing_type === 'rent').map(p => (
                        <tr key={p?.id || Math.random().toString()} className="group hover:bg-slate-50/80 transition-all">
                          <td className="px-6 py-6 font-display">
                            <div className="flex items-center gap-4">
                              <img src={p?.property_images?.[0]?.image_url || '/placeholder.svg'} className="h-14 w-14 rounded-xl object-cover ring-2 ring-slate-100" />
                              <div>
                                <div className="font-bold text-slate-900 line-clamp-1">{p?.title || 'Unknown Asset'}</div>
                                <div className="text-xs font-bold text-primary italic font-display">{p?.price ? `${formatCurrency(p.price)} / mo` : 'Contact'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-6">
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400">{(p?.profiles?.full_name || 'A')[0]}</div>
                              <span className="text-sm font-bold text-slate-600 truncate max-w-[120px]">{p?.profiles?.full_name || 'Anonymous User'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-6">
                            <Badge className={`rounded-xl px-4 py-1 border-none font-black text-[9px] tracking-widest uppercase ${p?.status === 'approved' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : (p?.status === 'sold' ? 'bg-slate-900 text-white' : 'bg-amber-500 text-white shadow-lg shadow-amber-500/20')}`}>
                              {p?.status || 'review'}
                            </Badge>
                          </td>
                          <td className="px-6 py-6 text-right">
                            <div className="flex justify-end gap-2">
                              {(p.status === 'pending' || !p.status) && (
                                <Button size="sm" onClick={() => updatePropertyStatus(p.id, 'approved')} className="bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl px-4 h-9 text-[10px] uppercase tracking-widest">Approve</Button>
                              )}
                              <Button variant="ghost" size="icon" onClick={() => deleteProperty(p.id)} className="h-9 w-9 text-slate-400 hover:text-red-500 rounded-xl hover:bg-red-50 transition-colors"><Trash2 className="h-4 w-4" /></Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="sale_history" className="animate-in fade-in slide-in-from-bottom-5 duration-500">
              <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-xl overflow-hidden min-h-[600px]">
                <div className="p-10 border-b bg-slate-50/50 flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <div className="h-16 w-16 rounded-3xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-inner">
                      <Handshake className="h-8 w-8" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-black text-slate-900 tracking-tight italic">Global Sale <span className="text-primary not-italic">Registry</span></h2>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Master record of all verified asset sales</p>
                    </div>
                  </div>
                  <Badge className="bg-emerald-500/10 text-emerald-500 text-[10px] font-black border-emerald-500/20 px-6 py-2 uppercase tracking-widest rounded-full">{allTransactions.filter(t => !t.properties?.listing_type || t.properties?.listing_type === 'sale').length} Settled Sales</Badge>
                </div>

                <div className="p-10">
                  <div className="grid gap-6">
                    {allTransactions.filter(t => !t.properties?.listing_type || t.properties?.listing_type === 'sale').map((t) => (
                      <div key={t.id} className="p-8 rounded-[3rem] border border-slate-100 bg-white hover:border-primary/20 hover:shadow-2xl transition-all group flex flex-col md:flex-row items-center justify-between gap-10">
                        <div className="flex items-center gap-8 flex-1">
                          <div className="flex flex-col items-center">
                            <div className="h-14 w-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-xl shadow-lg border-2 border-slate-800">
                              {(t.buyer_name || 'B')[0]}
                            </div>
                            <span className="text-[9px] font-black text-slate-300 uppercase mt-2">Buyer</span>
                          </div>

                          <div className="flex flex-col items-center px-4">
                            <ArrowRightLeft className="h-6 w-6 text-primary animate-pulse" />
                            <div className="h-px w-20 bg-slate-100 mt-2" />
                          </div>

                          <div className="flex flex-col items-center">
                            <div className="h-14 w-14 rounded-2xl bg-primary text-white flex items-center justify-center font-black text-xl shadow-lg border-2 border-primary/20">
                              {(t.seller_name || 'S')[0]}
                            </div>
                            <span className="text-[9px] font-black text-slate-300 uppercase mt-2">Seller</span>
                          </div>

                          <div className="ml-4 grid grid-cols-2 lg:grid-cols-4 gap-6 flex-1">
                            <div className="space-y-1">
                              <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-1">Asset Transferred</p>
                              <h4 className="text-lg font-black text-slate-900 truncate">{t.properties?.title || 'Unknown Property'}</h4>
                              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{t.properties?.location || 'Registered Site'}</p>
                            </div>
                            <div className="space-y-1 border-l border-slate-100 pl-4">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Method</p>
                              <Badge className="bg-slate-100 text-slate-600 border-none font-black text-[8px] px-2 py-0.5 uppercase tracking-widest">Digital Deed</Badge>
                              <p className="text-[8px] font-mono text-slate-400 mt-1 uppercase">EST-{t.id.slice(0, 8)}</p>
                            </div>
                            <div className="space-y-1 border-l border-slate-100 pl-4">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Grantor (Seller)</p>
                              <p className="text-sm font-black text-slate-900 truncate">{t.seller_name}</p>
                            </div>
                            <div className="space-y-1 border-l border-slate-100 pl-4">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Grantee (Buyer)</p>
                              <p className="text-sm font-black text-primary truncate">{t.buyer_name}</p>
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Status Code: 200 OK</p>
                          <div className="flex items-center gap-2 justify-end">
                            <Badge className="bg-emerald-500/10 text-emerald-600 border-none font-black text-[10px] px-4 py-1.5 rounded-xl uppercase">Settle Finalized</Badge>
                          </div>
                          <p className="text-[9px] font-bold text-slate-400 mt-4">{new Date(t.created_at).toLocaleDateString()}</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedCertificate(t)}
                            className="h-8 rounded-lg font-black text-[8px] uppercase tracking-widest text-primary hover:bg-primary/5 mt-2"
                          >
                            Registry Audit
                          </Button>
                        </div>
                      </div>
                    ))}

                    {allTransactions.filter(t => !t.properties?.listing_type || t.properties?.listing_type === 'sale').length === 0 && (
                      <div className="py-40 text-center space-y-4 rounded-[4rem] border-4 border-dashed border-slate-50 bg-slate-50/30">
                        <Handshake className="h-16 w-16 text-slate-200 mx-auto" />
                        <h3 className="text-xl font-black text-slate-300 uppercase tracking-widest">No settled transfers yet</h3>
                        <p className="text-slate-400 font-bold italic">High-value transactions will appear here once approved.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="rent_history" className="animate-in fade-in slide-in-from-bottom-5 duration-500">
              <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-xl overflow-hidden min-h-[600px]">
                <div className="p-10 border-b bg-slate-50/50 flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <div className="h-16 w-16 rounded-3xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-inner">
                      <KeyIcon className="h-8 w-8" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-black text-slate-900 tracking-tight italic">Global Rent <span className="text-primary not-italic">Registry</span></h2>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Master record of all verified rental agreements</p>
                    </div>
                  </div>
                  <Badge className="bg-emerald-500/10 text-emerald-500 text-[10px] font-black border-emerald-500/20 px-6 py-2 uppercase tracking-widest rounded-full">{allTransactions.filter(t => t.properties?.listing_type === 'rent').length} Settled Rentals</Badge>
                </div>

                <div className="p-10">
                  <div className="grid gap-6">
                    {allTransactions.filter(t => t.properties?.listing_type === 'rent').map((t) => (
                      <div key={t.id} className="p-8 rounded-[3rem] border border-slate-100 bg-white hover:border-primary/20 hover:shadow-2xl transition-all group flex flex-col md:flex-row items-center justify-between gap-10">
                        <div className="flex items-center gap-8 flex-1">
                          <div className="flex flex-col items-center">
                            <div className="h-14 w-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-xl shadow-lg border-2 border-slate-800">
                              {(t.buyer_name || 'T')[0]}
                            </div>
                            <span className="text-[9px] font-black text-slate-300 uppercase mt-2">Tenant</span>
                          </div>

                          <div className="flex flex-col items-center px-4">
                            <ArrowRightLeft className="h-6 w-6 text-primary animate-pulse" />
                            <div className="h-px w-20 bg-slate-100 mt-2" />
                          </div>

                          <div className="flex flex-col items-center">
                            <div className="h-14 w-14 rounded-2xl bg-primary text-white flex items-center justify-center font-black text-xl shadow-lg border-2 border-primary/20">
                              {(t.seller_name || 'L')[0]}
                            </div>
                            <span className="text-[9px] font-black text-slate-300 uppercase mt-2">Landlord</span>
                          </div>

                          <div className="ml-4 grid grid-cols-2 lg:grid-cols-4 gap-6 flex-1">
                            <div className="space-y-1">
                              <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-1">Asset Transferred</p>
                              <h4 className="text-lg font-black text-slate-900 truncate">{t.properties?.title || 'Unknown Property'}</h4>
                              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{t.properties?.location || 'Registered Site'}</p>
                            </div>
                            <div className="space-y-1 border-l border-slate-100 pl-4">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Method</p>
                              <Badge className="bg-slate-100 text-slate-600 border-none font-black text-[8px] px-2 py-0.5 uppercase tracking-widest">Rental Lease</Badge>
                              <p className="text-[8px] font-mono text-slate-400 mt-1 uppercase">LSE-{t.id.slice(0, 8)}</p>
                            </div>
                            <div className="space-y-1 border-l border-slate-100 pl-4">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Landlord</p>
                              <p className="text-sm font-black text-slate-900 truncate">{t.seller_name}</p>
                            </div>
                            <div className="space-y-1 border-l border-slate-100 pl-4">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tenant</p>
                              <p className="text-sm font-black text-primary truncate">{t.buyer_name}</p>
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Lease Active</p>
                          <div className="flex items-center gap-2 justify-end">
                            <Badge className="bg-emerald-500/10 text-emerald-600 border-none font-black text-[10px] px-4 py-1.5 rounded-xl uppercase">Agreement Settled</Badge>
                          </div>
                          <p className="text-[9px] font-bold text-slate-400 mt-4">{new Date(t.created_at).toLocaleDateString()}</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedCertificate(t)}
                            className="h-8 rounded-lg font-black text-[8px] uppercase tracking-widest text-primary hover:bg-primary/5 mt-2"
                          >
                            Lease Audit
                          </Button>
                        </div>
                      </div>
                    ))}

                    {allTransactions.filter(t => t.properties?.listing_type === 'rent').length === 0 && (
                      <div className="py-40 text-center space-y-4 rounded-[4rem] border-4 border-dashed border-slate-50 bg-slate-50/30">
                        <KeyIcon className="h-16 w-16 text-slate-200 mx-auto" />
                        <h3 className="text-xl font-black text-slate-300 uppercase tracking-widest">No settled rentals yet</h3>
                        <p className="text-slate-400 font-bold italic">Rental agreements will appear here once approved.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="users" className="animate-in fade-in slide-in-from-bottom-5 duration-500">

              <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
                <div className="p-8 border-b bg-slate-50/50 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center"><Users className="text-blue-600 h-5 w-5" /></div>
                  <h2 className="text-xl font-black">Authorized Personnel Identity Core</h2>
                </div>
                <div className="divide-y">
                  {[...(allUsers || [])].sort((a: any, b: any) => {
                    const aAdmin = a.user_roles?.some((r: any) => r.role === 'admin');
                    const bAdmin = b.user_roles?.some((r: any) => r.role === 'admin');
                    if (aAdmin && !bAdmin) return -1;
                    if (bAdmin && !aAdmin) return 1;
                    return 0;
                  }).map(u => {
                    const uid = u?.user_id || u?.id;
                    const isSeller = allProperties?.some(p => p?.posted_by === uid);
                    const isBuyer = inquiries?.some(i => i?.user_id === uid);

                    return (
                      <div key={uid} className="p-8 flex items-center justify-between hover:bg-slate-50 transition-all group">
                        <div className="flex items-center gap-6">
                          <div className="h-16 w-16 rounded-3xl bg-slate-100 flex items-center justify-center border-2 border-white shadow-sm">
                            <UserIcon className="h-8 w-8 text-slate-300" />
                          </div>
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              {(() => {
                                const isAdminUser = u.user_roles?.some((r: any) => r.role === 'admin');
                                const displayName = u.full_name || u.email?.split('@')[0] || 'User';
                                const nameColor = isAdminUser ? 'text-blue-600' : 'text-slate-900';

                                return (
                                  <>
                                    <div className={`font-black text-lg ${nameColor}`}>{displayName}</div>
                                    {isAdminUser && <Badge className="bg-red-500 text-white border-none font-black text-[9px] uppercase tracking-widest px-2 h-5">Admin</Badge>}
                                    {isSeller && !isAdminUser && <Badge className="bg-emerald-100 text-emerald-700 border-none font-black text-[9px] uppercase tracking-tighter self-start mt-1">Active Seller</Badge>}
                                    {isBuyer && !isAdminUser && <Badge className="bg-blue-100 text-blue-700 border-none font-black text-[9px] uppercase tracking-tighter self-start mt-1">Potential Buyer</Badge>}
                                  </>
                                );
                              })()}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 mt-2">
                              <div className="text-[10px] text-slate-400 font-bold lowercase">
                                <span className="text-slate-300 uppercase mr-1">Login:</span>
                                {u.email || 'no-mail@verified.com'}
                              </div>
                              <div className="text-[10px] text-slate-400 font-bold">
                                <span className="text-slate-300 uppercase mr-1">Pass (MOCK):</span>
                                <span className="bg-slate-200/50 px-2 py-0.5 rounded text-slate-700">{u.password || 'password123'}</span>
                              </div>
                            </div>
                            <div className="flex gap-1.5 mt-2">
                              {u.user_roles?.some((r: any) => r.role === 'admin') ? (
                                <Badge className="bg-slate-900 text-white text-[8px] uppercase font-black tracking-widest border-none px-2">ADMIN</Badge>
                              ) : (
                                <Badge className="bg-slate-700 text-white text-[8px] uppercase font-black tracking-widest border-none px-2">USER</Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Admin Action Bar */}
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteUser(uid, u.email)}
                            className="h-9 w-9 p-0 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50"
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="inquiries" className="animate-in fade-in slide-in-from-bottom-5 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {inquiries?.map(inq => {
                  const isPurchase = (inq?.message || '').includes('PURCHASE REQUEST') || (inq?.message || '').includes('🛑');
                  return (
                    <div key={inq.id} className={`p-8 rounded-[2.5rem] bg-white border-2 ${isPurchase ? 'border-red-500/20 shadow-red-100 shadow-2xl' : 'border-slate-100 shadow-sm'} hover:shadow-lg transition-all`}>
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-3">
                          <div className={`h-12 w-12 rounded-2xl ${isPurchase ? 'bg-red-50 flex items-center justify-center text-red-600' : 'bg-indigo-50 flex items-center justify-center text-indigo-600'}`}>
                            {isPurchase ? <ShieldCheck className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
                          </div>
                          <div>
                            <h4 className="font-black text-slate-900 text-lg line-clamp-1">{inq.properties?.title}</h4>
                            <p className={`text-[10px] font-black uppercase tracking-widest ${isPurchase ? 'text-red-500' : 'text-slate-400'}`}>
                              {isPurchase ? '🛑 URGENT BUY REQUEST 🛑' : `Inquiry from ${inq.user_full_name}`}
                            </p>
                          </div>
                        </div>
                        <Badge className={`${isPurchase ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-600'} text-[10px] font-black rounded-lg border-none`}>{new Date(inq.created_at).toLocaleDateString()}</Badge>
                      </div>
                      <div className={`p-6 rounded-2xl text-sm font-medium leading-relaxed border ${isPurchase ? 'bg-red-50/50 border-red-100 text-red-900 underline decoration-red-200 underline-offset-4' : 'bg-slate-50/80 border-slate-100 text-slate-600'}`}>
                        "{inq.message}"
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            {['approved', 'closed'].includes(inq.status as string) || (inq as any).isRecoveredOwnership ? 'Transaction Finalized' :
                              inq.properties?.status === 'sold' ? 'Sold to Another' : 'Verification Pending'}
                          </span>
                        </div>
                        {inq.status === 'approved' && (
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] h-9 px-4 rounded-xl shadow-lg"
                            onClick={async () => {
                              const { error } = await (supabase.rpc as any)('update_inquiry_status_rpc', {
                                p_inquiry_id: inq.id,
                                p_status: 'closed'
                              });

                              if (!error) {
                                setInquiries(prev => prev.map(i => i.id === inq.id ? { ...i, status: 'closed' as any } : i));
                                setAllProperties(prev => prev.map(p => p.id === inq.property_id ? { ...p, status: 'sold' as any } : p));
                                toast({
                                  title: "PROPERTY ACQUIRED!",
                                  description: "Congratulations! The estate has been officially transferred.",
                                  className: "bg-primary text-white font-bold"
                                });
                              } else {
                                toast({ title: "Action Failed", description: error.message, variant: "destructive" });
                              }
                            }}
                          >
                            Complete Buy Now
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="database" className="space-y-6 animate-in fade-in slide-in-from-bottom-5 duration-500">
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Table Navigation */}
                <aside className="lg:w-72 space-y-2">
                  <div className="p-6 rounded-[2rem] bg-slate-900 text-white shadow-xl mb-6">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] opacity-40 mb-4">Core Engine</h3>
                    <div className="space-y-1">
                      {TABLES.map((t) => (
                        <button
                          key={t.name}
                          onClick={() => setSelectedTable(t.name)}
                          className={cn(
                            "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all",
                            selectedTable === t.name
                              ? "bg-primary text-white shadow-lg shadow-primary/20 scale-105"
                              : "text-slate-400 hover:text-white hover:bg-white/5"
                          )}
                        >
                          <t.icon className="h-4 w-4" />
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="p-6 rounded-[2rem] bg-indigo-50 border-none">
                    <div className="flex items-center gap-2 text-indigo-600 mb-2">
                      <ShieldAlert className="h-4 w-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Write Access</span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-relaxed font-bold">
                      Direct database manipulation bypasses standard business logic. Proceed with operational caution.
                    </p>
                  </div>
                </aside>

                {/* Data Explorer */}
                <div className="flex-1 space-y-6">
                  <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden min-h-[600px] flex flex-col">
                    <div className="p-6 border-b bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><Database className="h-5 w-5" /></div>
                        <div>
                          <h2 className="text-lg font-black tracking-tight flex items-center gap-2 italic uppercase">
                            Explorer: <span className="text-primary not-italic">{selectedTable}</span>
                          </h2>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Viewing system-level source data</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="relative group">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                          <input
                            placeholder="Filter records..."
                            className="bg-white border-2 border-slate-100 rounded-xl pl-10 pr-4 h-10 w-48 text-xs font-bold focus:outline-none focus:border-primary transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                        </div>
                        <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-2" onClick={() => loadTableData(selectedTable)}>
                          <RefreshCw className={cn("h-4 w-4 text-slate-600", tableLoading && "animate-spin")} />
                        </Button>
                        <Button className="h-10 rounded-xl px-4 bg-slate-900 text-white font-bold text-xs flex items-center gap-2">
                          <Download className="h-4 w-4" /> Export
                        </Button>
                      </div>
                    </div>

                    <div className="flex-1 overflow-auto">
                      {tableLoading ? (
                        <div className="h-full flex flex-col items-center justify-center py-20 space-y-4">
                          <Loader2 className="h-12 w-12 animate-spin text-primary opacity-20" />
                          <p className="text-xs font-black text-slate-300 uppercase tracking-[0.3em]">Querying Database Architecture...</p>
                        </div>
                      ) : (
                        <div className="relative">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="border-b bg-slate-50/50">
                                {tableData.length > 0 && Object.keys(tableData[0]).map(key => (
                                  <th key={key} className="px-6 py-4 text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] whitespace-nowrap">{key}</th>
                                ))}
                                <th className="px-6 py-4 text-right sticky right-0 bg-slate-50 shadow-[-10px_0_10px_-5px_rgba(0,0,0,0.05)]">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                              {tableData
                                .filter(row => JSON.stringify(row).toLowerCase().includes(searchTerm.toLowerCase()))
                                .map((row, i) => (
                                  <tr key={i} className="group hover:bg-slate-50 transition-all">
                                    {Object.entries(row).map(([key, val], idx) => (
                                      <td key={idx} className="px-6 py-4 text-[11px] font-medium text-slate-600 max-w-[200px] truncate">
                                        {typeof val === 'object' ? (
                                          <Badge variant="outline" className="text-[8px] font-mono border-slate-100">{JSON.stringify(val).slice(0, 20)}...</Badge>
                                        ) : String(val)}
                                      </td>
                                    ))}
                                    <td className="px-6 py-4 text-right sticky right-0 bg-white group-hover:bg-slate-50 shadow-[-10px_0_10px_-5px_rgba(0,0,0,0.05)] transition-all">
                                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary" onClick={() => setEditingRow({ ...row })}><Edit3 className="h-4 w-4" /></Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-red-50 hover:text-red-600" onClick={() => deleteTableRow(selectedTable, row.id || row.user_id)}>
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                          {tableData.length === 0 && (
                            <div className="py-20 text-center space-y-4">
                              <Table className="h-12 w-12 text-slate-100 mx-auto" />
                              <p className="text-slate-300 font-bold uppercase tracking-widest text-[10px]">No records found in {selectedTable}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="p-4 border-t bg-slate-50/30 flex justify-between items-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Table className="h-3 w-3" /> {tableData.length} Records in Grid
                      </p>
                      <div className="flex items-center gap-1">
                        <Button variant="outline" size="sm" className="h-8 text-[10px] font-black uppercase rounded-lg">Prev</Button>
                        <Button variant="outline" size="sm" className="h-8 text-[10px] font-black uppercase rounded-lg">Next</Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          /* REGULAR USER BENTO DASHBOARD */
          <Tabs key="user-tabs" value={activeTab} onValueChange={handleTabChange} className="space-y-10">
            <div className="flex items-center justify-between border-b pb-4">
              <TabsList className="bg-transparent h-auto p-0 gap-8">
                {['overview', 'portfolio', 'leads', 'sale_history', 'rent_history', 'settings'].map((tab) => (
                  <TabsTrigger
                    key={tab}
                    value={tab}
                    className="capitalize text-slate-500 font-black text-sm tracking-widest pb-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent transition-all"
                  >
                    {(tab || '').toString().replace('_', ' ')}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <TabsContent value="overview" className="space-y-12 animate-in fade-in zoom-in-95 duration-500">
              {/* User Hero Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in stagger-1">
                {userStats.map((s, idx) => (
                  <div key={idx} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex items-center gap-4">
                      <div className={`h-12 w-12 rounded-xl ${s.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <s.icon className={`h-6 w-6 ${s.color}`} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
                        <h4 className="text-2xl font-black text-slate-900">{s.count}</h4>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid gap-8 lg:grid-cols-12 animate-fade-in stagger-2">
                {/* Left Bento Column (8 cols) */}
                <div className="lg:col-span-8 space-y-8">
                  {/* Active Portfolio Bento Card Summary */}
                  <div className="bg-white rounded-[3rem] border border-slate-100 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)] overflow-hidden">
                    <div className="p-8 pb-4 flex items-center justify-between border-b border-slate-50">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100">
                          <LayoutDashboard className="h-6 w-6" />
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Your Asset <span className="text-primary italic">Inventory</span></h2>
                      </div>
                      <Link to="/properties" className="text-xs font-black uppercase tracking-widest text-primary hover:gap-2 flex items-center gap-1 transition-all">Explore Market <ArrowUpRight className="h-4 w-4" /></Link>
                    </div>

                    <div className="p-4 sm:p-8">
                      <div className="grid gap-6">
                        {myProperties && myProperties.length > 0 ? myProperties.slice(0, 3).map(p => (
                          <div key={p.id} className="p-4 rounded-[2rem] bg-slate-50/50 border border-slate-100 group flex flex-col sm:flex-row items-center gap-6 hover:bg-white hover:shadow-xl transition-all">
                            <Link to={`/properties/${p.id}`} className="relative h-20 w-32 shrink-0 rounded-2xl overflow-hidden shadow-md">
                              <img src={p.property_images?.[0]?.image_url || '/placeholder.svg'} className="h-full w-full object-cover" />
                            </Link>
                            <div className="flex-1 space-y-1">
                              <h4 className="text-lg font-black text-slate-800 line-clamp-1">{p.title}</h4>
                              <div className="flex items-center gap-4">
                                <div className="text-md font-black text-primary italic">{p?.price ? formatCurrency(p.price) : 'Contact for Price'}</div>
                                <Badge className={`text-[8px] font-black uppercase tracking-tighter px-2 h-4 border-none shadow-sm ${(p.status as string) === 'approved' ? 'bg-emerald-500 text-white' : (p.status as string) === 'sold' ? 'bg-slate-900 text-white' : 'bg-amber-500 text-white'}`}>{p.status}</Badge>
                              </div>
                            </div>
                          </div>
                        )) : (
                          <div className="text-center py-12 px-6 border-2 border-dashed border-slate-100 rounded-[2rem] bg-slate-50/50">
                            <Building2 className="h-10 w-10 text-slate-300 mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-slate-500">No properties in your inventory</h3>
                            <p className="text-xs text-slate-400 mt-2 mb-6 max-w-sm mx-auto">Get started by listing your first premium real estate property to instantly reach verified buyers.</p>
                            <Link to="/add-property">
                              <Button className="h-12 px-8 rounded-xl bg-slate-900 text-white hover:bg-primary font-bold transition-all shadow-md">
                                <Plus className="h-4 w-4 mr-2" /> List an Asset
                              </Button>
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Bento Sidebar (4 cols) */}
                <div className="lg:col-span-4 space-y-8">
                  {/* User Identity Card */}
                  <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden p-10 text-center relative group">
                    <div className="absolute top-0 left-0 w-full h-2 bg-primary"></div>
                    <div className="relative z-10">
                      <div className="h-32 w-32 rounded-[2.5rem] mx-auto bg-slate-50 border-4 border-white shadow-2xl overflow-hidden mb-6 relative">
                        <div className="h-full w-full flex items-center justify-center text-slate-200">
                          {profile?.avatar_url ? (
                            <img src={profile.avatar_url} className="h-full w-full object-cover" />
                          ) : <UserIcon className="h-16 w-16" />}
                        </div>
                      </div>
                      <div className="flex flex-col items-center gap-2 mb-10">
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">{profile?.full_name || user?.fullName || 'Premium Member'}</h2>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-slate-900 text-white font-black text-[9px] uppercase tracking-widest px-3">Gold Tier</Badge>
                        </div>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2">ID: {user?.id?.slice(0, 12)}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <Button
                          variant="outline"
                          className="h-14 rounded-2xl font-black text-sm border-slate-100 border-2 hover:bg-slate-50 transition-all"
                          onClick={() => handleTabChange('settings')}
                        >
                          Edit Details
                        </Button>
                        <Button variant="outline" className="h-14 rounded-2xl font-black text-sm border-slate-100 border-2 hover:bg-slate-50 transition-all">Security</Button>
                        <Button
                          variant="link"
                          className="col-span-2 text-red-500/50 hover:text-red-500 font-bold uppercase text-[10px] tracking-[0.2em] mt-2 no-underline"
                          onClick={() => signOut().then(() => navigate('/login'))}
                        >
                          De-authenticate Session
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="portfolio" className="animate-in fade-in slide-in-from-bottom-5 duration-500">
              <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-xl overflow-hidden min-h-[600px]">
                <div className="p-10 border-b bg-slate-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Asset <span className="text-primary italic">Portfolio</span></h2>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Manage and monitor your digital estate holdings</p>
                  </div>
                  <Link to="/add-property">
                    <Button className="h-14 px-8 rounded-2xl bg-secondary hover:bg-secondary/90 text-slate-900 font-black text-sm flex items-center gap-2 shadow-lg shadow-indigo-100">
                      <Plus className="h-5 w-5" /> List New Asset
                    </Button>
                  </Link>
                </div>
                <div className="p-10 space-y-16">
                  {/* UN-SOLD / ACTIVE PROPERTIES */}
                  <div>
                    <div className="flex items-center gap-3 mb-8">
                      <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      <h3 className="text-xl font-black uppercase tracking-widest text-slate-900">Active <span className="text-primary italic">Inventory</span></h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {myProperties && myProperties.filter(p => p.status !== 'sold').length > 0 ? myProperties.filter(p => p.status !== 'sold').map(p => (
                        <div key={p.id} className="group bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all duration-500">
                          <div className="relative aspect-[4/3] overflow-hidden">
                            <img src={p.property_images?.[0]?.image_url || '/placeholder.svg'} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                            <div className="absolute top-4 left-4 z-10">
                              <Badge className={cn(
                                "text-[9px] font-black uppercase tracking-widest px-4 h-6 border-none rounded-full shadow-lg",
                                p.status === 'approved' ? "bg-emerald-500 text-white" :
                                  p.status === 'sold' ? "bg-slate-900 text-white" : "bg-primary text-white"
                              )}>
                                {p.status}
                              </Badge>
                            </div>
                          </div>
                          <div className="p-6 space-y-4">
                            <div>
                              <h4 className="text-lg font-black text-slate-900 line-clamp-1">{p.title}</h4>
                              <p className="text-xs font-bold text-slate-400 flex items-center gap-1.5 mt-1"><MapPin className="h-3 w-3" /> {p.city}</p>
                            </div>
                            <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                              <div className="text-xl font-black text-primary italic">{p.price ? formatCurrency(p.price) : 'Contact'}</div>
                              <div className="flex gap-2">
                                <Link to={`/properties/${p.id}`}><Button size="icon" variant="ghost" className="h-10 w-10 rounded-xl bg-slate-50 hover:bg-primary hover:text-white"><ArrowUpRight className="h-5 w-5" /></Button></Link>
                                <Button size="icon" variant="ghost" onClick={() => deleteProperty(p.id)} className="h-10 w-10 rounded-xl bg-slate-50 hover:bg-red-50 hover:text-red-500"><Trash2 className="h-5 w-5" /></Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )) : (
                        <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-100 rounded-[2rem] bg-slate-50/50">
                          <p className="text-slate-400 font-bold italic text-sm">No active listings in your vault.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ACQUIRED ASSETS (Bought) */}
                  {myProperties && myProperties.filter(p => {
                    const isSold = p.status === 'sold';
                    const iAmBuyer = inquiries?.some(i => i.property_id === p.id && i.is_sold_to_me);
                    return isSold && iAmBuyer;
                  }).length > 0 && (
                      <div className="pt-8 border-t border-slate-100">
                        <div className="flex items-center gap-3 mb-8">
                          <div className="h-2 w-2 rounded-full bg-emerald-500" />
                          <h3 className="text-xl font-black uppercase tracking-widest text-emerald-600">Acquired <span className="text-slate-900 italic">Portfolio</span></h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                          {myProperties.filter(p => {
                            const isSold = p.status === 'sold';
                            const iAmBuyer = inquiries?.some(i => i.property_id === p.id && i.is_sold_to_me);
                            return isSold && iAmBuyer;
                          }).map(p => (
                            <div key={p.id} className="group bg-white rounded-[2.5rem] border border-emerald-100 overflow-hidden hover:shadow-2xl transition-all duration-500">
                              <div className="relative aspect-[4/3] overflow-hidden">
                                <img src={p.property_images?.[0]?.image_url || '/placeholder.svg'} className="h-full w-full object-cover" />
                                <div className="absolute top-4 left-4 z-10">
                                  <Badge className="bg-emerald-600 text-white font-black text-[9px] px-3 py-1 uppercase tracking-widest rounded-full">Acquired</Badge>
                                </div>
                              </div>
                              <div className="p-6">
                                <h4 className="text-lg font-black text-slate-900 line-clamp-1">{p.title}</h4>
                                <div className="flex items-center justify-between mt-4">
                                  <p className="text-xs font-bold text-slate-400">Official Holder: {user?.fullName}</p>
                                  <Link to={`/properties/${p.id}`}><Button size="sm" variant="ghost" className="rounded-xl text-primary font-bold">View Asset</Button></Link>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* LIQUIDATED ASSETS (Sold) */}
                  {myProperties && myProperties.filter(p => {
                    const isSold = p.status === 'sold';
                    const curName = (user?.fullName || '').toLowerCase().trim();
                    const iAmSeller = p.posted_by === user.id || (p.profiles?.full_name || '').toLowerCase().trim() === curName;
                    return isSold && iAmSeller && !inquiries?.some(i => i.property_id === p.id && i.is_sold_to_me);
                  }).length > 0 && (
                      <div className="pt-8 border-t border-slate-100">
                        <div className="flex items-center gap-3 mb-8">
                          <div className="h-2 w-2 rounded-full bg-slate-400" />
                          <h3 className="text-xl font-black uppercase tracking-widest text-slate-400">Liquidated <span className="text-slate-900 italic">Assets</span></h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                          {myProperties.filter(p => {
                            const isSold = p.status === 'sold';
                            const curName = (user?.fullName || '').toLowerCase().trim();
                            const iAmSeller = p.posted_by === user.id || (p.profiles?.full_name || '').toLowerCase().trim() === curName;
                            return isSold && iAmSeller && !inquiries?.some(i => i.property_id === p.id && i.is_sold_to_me);
                          }).map(p => (
                            <div key={p.id} className="group bg-slate-50/50 rounded-[2.5rem] border border-slate-100 overflow-hidden opacity-80 grayscale-[0.5] hover:opacity-100 hover:grayscale-0 transition-all duration-500">
                              <div className="relative aspect-[4/3] overflow-hidden">
                                <img src={p.property_images?.[0]?.image_url || '/placeholder.svg'} className="h-full w-full object-cover" />
                                <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px]" />
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                  <Badge className="bg-red-600 text-white font-black text-lg px-6 py-2 uppercase tracking-widest shadow-2xl skew-x-[-10deg]">Sold</Badge>
                                </div>
                              </div>
                              <div className="p-6">
                                <h4 className="text-lg font-black text-slate-600 line-clamp-1">{p.title}</h4>
                                <div className="flex items-center justify-between mt-4">
                                  <div className="text-lg font-black text-slate-400 line-through">{formatCurrency(p.price || 0)}</div>
                                  <Link to={`/properties/${p.id}`}><Button size="sm" variant="outline" className="rounded-xl font-black text-[10px] uppercase">Audit Asset</Button></Link>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {(!myProperties || myProperties.length === 0) && (
                    <div className="py-20 flex flex-col items-center justify-center text-center">
                      <div className="h-24 w-24 rounded-[2rem] bg-slate-50 flex items-center justify-center border-2 border-dashed border-slate-200 mb-6">
                        <LayoutDashboard className="h-10 w-10 text-slate-300" />
                      </div>
                      <h3 className="text-3xl font-black text-slate-900 tracking-tight mb-3">Your Vault is Empty</h3>
                      <p className="text-slate-500 font-medium max-w-md mx-auto mb-8">
                        It looks like you haven't listed any properties yet. Your portfolio is the key to connecting with verified buyers.
                      </p>
                      <Link to="/add-property">
                        <Button className="h-14 px-10 rounded-2xl bg-slate-900 text-white hover:bg-primary font-bold transition-all shadow-xl hover:-translate-y-1">
                          <Plus className="h-5 w-5 mr-2" /> Start Your First Listing
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="leads" className="animate-in fade-in slide-in-from-bottom-5 duration-500">
              <div className="bg-slate-900 rounded-[3.5rem] p-10 text-white min-h-[600px] overflow-hidden relative">
                <div className="absolute top-0 right-0 p-20 opacity-5 rotate-12 transition-transform duration-1000"><MessageSquare className="h-96 w-96" /></div>
                <div className="relative z-10">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-12">
                    <div className="flex items-center gap-6">
                      <div className="h-20 w-20 rounded-[2rem] bg-primary/20 flex items-center justify-center border border-primary/30 shadow-inner"><MessageSquare className="h-10 w-10 text-primary" /></div>
                      <div>
                        <h3 className="text-4xl font-black tracking-tight">Purchase <span className="text-primary italic">Inquiries</span></h3>
                        <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]">Authenticated Buyer Conversations</p>
                      </div>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400"><Info className="h-5 w-5" /></div>
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Current Session ID</p>
                        <p className="text-[10px] font-mono text-white/60">...{user?.id?.slice(-12)}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-10 text-[10px] uppercase font-black tracking-widest hover:bg-white/10"
                        onClick={() => {
                          toast({
                            title: "Session Status",
                            description: `You are logged in as ${user?.email}. Your ID is now permanent.`,
                          });
                        }}
                      >
                        Verify Identity
                      </Button>
                    </div>
                  </div>

                  <div className="mb-8 p-6 rounded-[2rem] bg-amber-500/10 border border-amber-500/20 text-amber-200 text-sm">
                    <div className="flex items-start gap-4">
                      <ShieldAlert className="h-5 w-5 shrink-0" />
                      <div>
                        <p className="font-bold mb-1">Missing a message from a buyer?</p>
                        <p className="opacity-80">If you listed properties before the "Permanent ID" fix, you might need to re-list them to see new leads. <span className="underline cursor-pointer" onClick={() => navigate('/add-property')}>List New Estate</span></p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-16">
                    {/* ─── Purchase Requests Section ────────────────────────── */}
                    <div>
                      <div className="flex items-center gap-4 mb-8">
                        <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                        <h4 className="text-xl font-black uppercase tracking-widest text-slate-200">Purchase <span className="text-red-500">Commitments</span></h4>
                        <div className="flex-1 h-px bg-white/5" />
                        <Badge className="bg-red-500/10 text-red-500 border-red-500/20">{inquiries?.filter(i => (i?.message || '').includes('🛑') || (i?.message || '').includes('PURCHASE REQUEST')).length || 0}</Badge>
                      </div>

                      <div className="grid gap-6">
                        {inquiries?.filter(i => (i?.message || '').includes('🛑') || (i?.message || '').includes('PURCHASE REQUEST')).map(inq => {
                          const curNameNormal = (user?.fullName || '').toLowerCase().trim();
                          const bNameNormal = (inq.user_full_name || '').toLowerCase().trim();
                          const isSentByMe = inq.user_id === user?.id || (curNameNormal && bNameNormal && curNameNormal === bNameNormal);

                          // Use the deep recovery flags from our ULTRA RPC
                          const isApproved = inq.is_sold_to_me || ['approved', 'closed'].includes(inq.status as string);
                          const isSoldToOther = inq.is_sold_to_other;
                          const ownerName = inq.properties?.posted_by === user?.id ? 'You' : (inq.property_owner_name || 'The Owner');

                          return (
                            <div key={inq.id} className={cn(
                              "group p-8 rounded-[3rem] border transition-all flex flex-col md:flex-row items-center justify-between gap-8",
                              isApproved ? "border-emerald-500/20 bg-emerald-500/5 shadow-[0_0_40px_rgba(16,185,129,0.05)]" :
                                isSoldToOther ? "border-slate-500/10 bg-slate-500/5 opacity-70" :
                                  "border-red-500/10 bg-red-500/5 hover:bg-red-500/10"
                            )}>
                              <div className="flex items-center gap-8">
                                <div className={cn(
                                  "h-20 w-20 rounded-[1.5rem] border-2 flex items-center justify-center font-black text-2xl shadow-xl transition-all",
                                  isApproved ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30 rotate-3" :
                                    isSoldToOther ? "bg-slate-500/20 text-slate-400 border-slate-500/30 grayscale" :
                                      "bg-red-500/20 text-red-400 border-red-500/30"
                                )}>
                                  {isSentByMe ? 'ME' : (inq?.user_full_name?.[0] || 'U')}
                                </div>
                                <div className="space-y-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <h4 className="font-bold text-2xl text-white">
                                      {isSentByMe ? `Request for ${inq.properties?.title}` : inq.user_full_name}
                                    </h4>
                                    {isApproved ? (
                                      <Badge className="bg-emerald-500/20 text-emerald-400 text-[8px] font-black border-none uppercase tracking-widest px-3 italic">Sale Finalized</Badge>
                                    ) : isSoldToOther ? (
                                      <Badge className="bg-slate-500/20 text-slate-400 text-[8px] font-black border-none uppercase tracking-widest px-3">Asset Liquidation Complete</Badge>
                                    ) : (
                                      <Badge className="bg-red-500/20 text-red-400 text-[8px] font-black border-none uppercase tracking-widest px-3">Priority Lead</Badge>
                                    )}
                                  </div>

                                  {isSentByMe && isApproved ? (
                                    <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 animate-in zoom-in-95 duration-500">
                                      <p className="text-emerald-400 font-black text-lg flex items-center gap-2">
                                        <CheckCircle className="h-5 w-5" /> {ownerName} sold this property to you!
                                      </p>
                                      <p className="text-white/60 text-sm mt-1 font-medium italic">Asset secured. Check your portfolio for the Digital Deed.</p>
                                    </div>
                                  ) : isSentByMe && isSoldToOther ? (
                                    <div className="p-4 rounded-2xl bg-slate-500/10 border border-slate-500/20">
                                      <p className="text-slate-400 font-black text-lg flex items-center gap-2">
                                        <ShieldAlert className="h-5 w-5" /> Sold to another buyer
                                      </p>
                                      <p className="text-white/40 text-sm mt-1">This listing is no longer available for acquisition.</p>
                                    </div>
                                  ) : (
                                    <p className="text-slate-300 italic text-lg leading-relaxed max-w-2xl font-medium">"{inq.message}"</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-4">
                                {isApproved ? (
                                  <div className="h-16 px-10 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-black uppercase tracking-widest text-[10px] gap-2">
                                    <ShieldCheck className="h-4 w-4" /> Transaction Complete
                                  </div>
                                ) : isSoldToOther ? (
                                  <div className="h-16 px-10 rounded-2xl bg-slate-500/10 text-slate-400 border border-slate-500/20 flex items-center justify-center font-black uppercase tracking-widest text-[10px] gap-2 opacity-50">
                                    <Building2 className="h-4 w-4" /> Asset Sold
                                  </div>
                                ) : !isSentByMe ? (
                                  <Button
                                    className="h-16 px-10 rounded-[2rem] bg-white text-slate-900 hover:bg-primary hover:text-white font-black uppercase tracking-widest text-[10px] transition-all shadow-xl"
                                    onClick={async () => {
                                      // Single RPC call handles both status update, property status, and rejecting others
                                      const { error } = await (supabase.rpc as any)('update_inquiry_status_rpc', {
                                        p_inquiry_id: inq.id,
                                        p_status: 'approved'
                                      });

                                      if (!error) {
                                        setInquiries(prev => prev.map(i => i.id === inq.id ? { ...i, status: 'approved' as any, is_sold_to_me: true } : i));
                                        setMyProperties(prev => prev.map(p => p.id === inq.property_id ? { ...p, status: 'sold' as any } : p));
                                        toast({ title: "Authorized", description: `Sale authorized for ${inq.user_full_name}. Property is now SOLD.`, className: "bg-emerald-600 text-white font-black" });
                                      } else {
                                        toast({ title: "Action Failed", description: error.message, variant: "destructive" });
                                      }
                                    }}
                                  >
                                    Accept Buy Request
                                  </Button>
                                ) : (
                                  <div className="h-16 px-10 rounded-2xl bg-white/5 text-white/40 border border-white/10 flex items-center justify-center font-black uppercase tracking-widest text-[10px]">
                                    {isSentByMe ? 'Awaiting Final Response' : 'Action Required'}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                        {inquiries?.filter(i => (i.message || '').includes('🛑')).length === 0 && (
                          <div className="p-12 text-center text-slate-500 font-bold italic border-2 border-dashed border-white/5 rounded-[3rem]">
                            No active purchase commitments.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* ─── General Enquiries Section ────────────────────────── */}
                    <div>
                      <div className="flex items-center gap-4 mb-8">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                        <h4 className="text-xl font-black uppercase tracking-widest text-slate-200">General <span className="text-primary italic">Inquiries</span></h4>
                        <div className="flex-1 h-px bg-white/5" />
                        <Badge className="bg-primary/10 text-primary border-primary/20">{inquiries?.filter(i => !(i.message || '').includes('🛑')).length || 0}</Badge>
                      </div>

                      <div className="grid gap-6">
                        {inquiries?.filter(i => !(i.message || '').includes('🛑')).map(inq => (
                          <div key={inq.id} className="group p-8 rounded-[3rem] border border-white/5 bg-white/5 hover:bg-white/10 transition-all flex flex-col md:flex-row items-center justify-between gap-8">
                            <div className="flex items-center gap-8">
                              <div className="h-20 w-20 rounded-[1.5rem] bg-primary/20 text-primary border-2 border-primary/30 flex items-center justify-center font-black text-2xl shadow-xl">
                                {inq?.user_full_name?.[0] || 'U'}
                              </div>
                              <div>
                                <div className="flex items-center gap-3 mb-2">
                                  <h4 className="font-bold text-2xl text-white">{inq.user_full_name}</h4>
                                  <Badge className="bg-primary/20 text-primary text-[8px] font-black border-none uppercase tracking-widest px-3">Information Request</Badge>
                                </div>
                                <p className="text-slate-400 italic text-lg leading-relaxed max-w-2xl">"{inq.message}"</p>
                              </div>
                            </div>
                            <Button variant="ghost" className="h-16 px-10 rounded-[2rem] border border-white/10 text-white font-black uppercase tracking-widest text-[10px]" onClick={() => window.location.href = `mailto:${inq.user_email || ''}`}>
                              Reply via Email
                            </Button>
                          </div>
                        ))}
                        {inquiries?.filter(i => !(i.message || '').includes('🛑')).length === 0 && (
                          <div className="p-12 text-center text-slate-500 font-bold italic border-2 border-dashed border-white/5 rounded-[3rem]">
                            No general enquiries yet.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="sale_history" className="animate-in fade-in slide-in-from-bottom-5 duration-500">
              <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-xl overflow-hidden min-h-[600px]">
                <div className="p-10 border-b bg-slate-50/50 flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <div className="h-16 w-16 rounded-3xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-inner">
                      <HistoryIcon className="h-8 w-8" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-black text-slate-900 tracking-tight">Sale <span className="text-primary italic">Ledger</span></h2>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Historical record of your asset sales and acquisitions</p>
                    </div>
                  </div>
                </div>

                <div className="p-10">
                  <div className="grid gap-8">
                    {inquiries?.filter(i => ['approved', 'closed'].includes(i.status as string) && (!i.properties?.listing_type || i.properties?.listing_type === 'sale')).map((t: any) => {
                      const curName = (user?.fullName || '').toLowerCase().trim();
                      const bName = (t.buyer_name || t.user_full_name || '').toLowerCase().trim();
                      const isBuyer = t.user_id === user?.id || (curName && bName && curName === bName);
                      const roleTag = isBuyer ? "Acquisition" : "Liquidation";

                      return (
                        <div key={t.id} className="p-8 rounded-[3rem] border border-slate-100 bg-white hover:border-primary/20 hover:shadow-2xl transition-all group">
                          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                            <div className="flex items-center gap-6">
                              <div className={cn(
                                "h-16 w-16 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg",
                                isBuyer ? "bg-slate-900" : "bg-primary"
                              )}>
                                {roleTag ? roleTag[0] : 'H'}
                              </div>
                              <div>
                                <div className="flex items-center gap-3 mb-1">
                                  <Badge className={cn(
                                    "border-none font-black text-[8px] uppercase tracking-widest px-3",
                                    isBuyer ? "bg-slate-900 text-white" : "bg-primary/20 text-primary"
                                  )}>
                                    {roleTag}
                                  </Badge>
                                  <span className="text-[10px] font-bold text-slate-400">{new Date(t.created_at).toLocaleDateString()}</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-4 mt-4">
                                  <div className="space-y-1">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Asset Name</p>
                                    <p className="text-md font-black text-slate-900 truncate">{t.properties?.title || 'Estate Asset'}</p>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Registry</p>
                                    <p className="text-sm font-bold text-slate-500 truncate">{t.properties?.location || 'Prime Site'}</p>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Seller</p>
                                    <p className="text-sm font-black text-slate-900 truncate">{t.seller_name || 'Verified Seller'}</p>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Buyer</p>
                                    <p className="text-sm font-black text-primary truncate">{t.buyer_name || 'Verified Buyer'}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="h-14 w-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 group-hover:text-primary transition-colors">
                              <Handshake className="h-6 w-6" />
                            </div>
                          </div>
                          <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between">
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Verification ID: {t.id.slice(0, 8)}</p>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedCertificate(t)} className="h-10 rounded-xl font-black text-[10px] uppercase tracking-widest text-primary hover:bg-primary/5">View Certificate</Button>
                          </div>
                        </div>
                      );
                    })}

                    {inquiries?.filter(i => ['approved', 'closed'].includes(i.status as string) && (!i.properties?.listing_type || i.properties?.listing_type === 'sale')).length === 0 && (
                      <div className="py-40 text-center space-y-4 rounded-[4rem] border-4 border-dashed border-slate-50 bg-slate-50/30">
                        <HistoryIcon className="h-16 w-16 text-slate-200 mx-auto" />
                        <h3 className="text-xl font-black text-slate-300 uppercase tracking-widest">No sale history</h3>
                        <p className="text-slate-400 font-bold italic">Settled property sales will appear here.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="rent_history" className="animate-in fade-in slide-in-from-bottom-5 duration-500">
              <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-xl overflow-hidden min-h-[600px]">
                <div className="p-10 border-b bg-slate-50/50 flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <div className="h-16 w-16 rounded-3xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-inner">
                      <KeyIcon className="h-8 w-8" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-black text-slate-900 tracking-tight">Rent <span className="text-primary italic">Ledger</span></h2>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Historical record of your rental agreements</p>
                    </div>
                  </div>
                </div>

                <div className="p-10">
                  <div className="grid gap-8">
                    {inquiries?.filter(i => ['approved', 'closed'].includes(i.status as string) && i.properties?.listing_type === 'rent').map((t: any) => {
                      const curName = (user?.fullName || '').toLowerCase().trim();
                      const bName = (t.buyer_name || t.user_full_name || '').toLowerCase().trim();
                      const isTenant = t.user_id === user?.id || (curName && bName && curName === bName);
                      const roleTag = isTenant ? "Tenancy" : "Lease Out";

                      return (
                        <div key={t.id} className="p-8 rounded-[3rem] border border-slate-100 bg-white hover:border-primary/20 hover:shadow-2xl transition-all group">
                          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                            <div className="flex items-center gap-6">
                              <div className={cn(
                                "h-16 w-16 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg",
                                isTenant ? "bg-slate-900" : "bg-primary"
                              )}>
                                {roleTag ? roleTag[0] : 'H'}
                              </div>
                              <div>
                                <div className="flex items-center gap-3 mb-1">
                                  <Badge className={cn(
                                    "border-none font-black text-[8px] uppercase tracking-widest px-3",
                                    isTenant ? "bg-slate-900 text-white" : "bg-primary/20 text-primary"
                                  )}>
                                    {roleTag}
                                  </Badge>
                                  <span className="text-[10px] font-bold text-slate-400">{new Date(t.created_at).toLocaleDateString()}</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-4 mt-4">
                                  <div className="space-y-1">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Asset Name</p>
                                    <p className="text-md font-black text-slate-900 truncate">{t.properties?.title || 'Rental Estate'}</p>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Registry</p>
                                    <p className="text-sm font-bold text-slate-500 truncate">{t.properties?.location || 'Prime Site'}</p>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Landlord</p>
                                    <p className="text-sm font-black text-slate-900 truncate">{t.seller_name || 'Verified Landlord'}</p>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tenant</p>
                                    <p className="text-sm font-black text-primary truncate">{t.buyer_name || 'Verified Tenant'}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="h-14 w-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 group-hover:text-primary transition-colors">
                              <Handshake className="h-6 w-6" />
                            </div>
                          </div>
                          <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between">
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Agreement ID: {t.id.slice(0, 8)}</p>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedCertificate(t)} className="h-10 rounded-xl font-black text-[10px] uppercase tracking-widest text-primary hover:bg-primary/5">View Agreement</Button>
                          </div>
                        </div>
                      );
                    })}

                    {inquiries?.filter(i => ['approved', 'closed'].includes(i.status as string) && i.properties?.listing_type === 'rent').length === 0 && (
                      <div className="py-40 text-center space-y-4 rounded-[4rem] border-4 border-dashed border-slate-50 bg-slate-50/30">
                        <KeyIcon className="h-16 w-16 text-slate-200 mx-auto" />
                        <h3 className="text-xl font-black text-slate-300 uppercase tracking-widest">No rental history</h3>
                        <p className="text-slate-400 font-bold italic">Settled rental agreements will appear here.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="animate-in fade-in slide-in-from-bottom-5 duration-500">
              <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-xl overflow-hidden">
                <div className="p-10 border-b bg-slate-50/50 flex items-center gap-5">
                  <div className="h-16 w-16 rounded-3xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-inner">
                    <Settings className="h-8 w-8" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Identity & <span className="text-primary italic">Profile</span></h2>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global metadata management and physical verification details</p>
                  </div>
                </div>
                <div className="p-10">
                  <form onSubmit={updateProfile} className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
                    <div className="space-y-8">
                      <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">Legal Identity (Full Name)</Label>
                        <Input
                          value={profileForm.fullName}
                          onChange={e => setProfileForm(prev => ({ ...prev, fullName: e.target.value }))}
                          className="h-16 rounded-3xl bg-slate-50 border-none focus:ring-4 focus:ring-primary/5 transition-all text-lg font-black text-slate-800 px-8"
                          placeholder="John Doe"
                        />
                      </div>
                      <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">Verified Telecommunications (Phone)</Label>
                        <Input
                          value={profileForm.phone}
                          onChange={e => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                          className="h-16 rounded-3xl bg-slate-50 border-none focus:ring-4 focus:ring-primary/5 transition-all text-lg font-black text-slate-800 px-8"
                          placeholder="+91 99999 99999"
                        />
                      </div>
                    </div>
                    <div className="space-y-8">
                      <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">Digital Biography</Label>
                        <Textarea
                          rows={8}
                          value={profileForm.bio}
                          onChange={e => setProfileForm(prev => ({ ...prev, bio: e.target.value }))}
                          className="rounded-[2rem] bg-slate-50 border-none focus:ring-4 focus:ring-primary/5 transition-all text-lg font-medium text-slate-700 p-8 resize-none shadow-inner"
                          placeholder="A brief history of your estate legacy..."
                        />
                      </div>
                      <Button
                        type="submit"
                        className="w-full h-20 rounded-[2.5rem] bg-slate-900 hover:bg-primary text-white font-black text-xl transition-all shadow-2xl shadow-indigo-100 group"
                        disabled={updatingProfile}
                      >
                        {updatingProfile ? <Loader2 className="animate-spin h-8 w-8" /> : <span className="flex items-center gap-3">Commit Profile Changes <Sparkles className="h-6 w-6 group-hover:rotate-12 transition-transform" /></span>}
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </main>

      {/* Database Edit Dialog */}
      <Dialog open={!!editingRow} onOpenChange={(open) => !open && setEditingRow(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-[2rem] border-none shadow-2xl">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="text-2xl font-black italic text-slate-900 uppercase">Edit Record: <span className="text-primary not-italic">{selectedTable}</span></DialogTitle>
            <DialogDescription className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">PK: {editingRow?.id || editingRow?.user_id || 'System Generated'}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-8">
            {editingRow && Object.entries(editingRow).map(([key, value]) => {
              const isReadOnly = ['created_at', 'updated_at', 'id', 'user_id'].includes(key);
              return (
                <div key={key} className="grid grid-cols-4 items-center gap-6">
                  <Label htmlFor={key} className="text-right text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    {key}
                  </Label>
                  <Input
                    id={key}
                    value={value === null ? '' : typeof value === 'object' ? JSON.stringify(value) : String(value)}
                    disabled={isReadOnly}
                    className={cn(
                      "col-span-3 h-12 rounded-xl border-2 transition-all font-medium text-sm px-4",
                      isReadOnly ? "bg-slate-50 border-slate-100 text-slate-400 italic" : "border-slate-100 focus:border-primary focus:ring-4 focus:ring-primary/5"
                    )}
                    onChange={(e) => setEditingRow({ ...editingRow, [key]: e.target.value })}
                  />
                </div>
              );
            })}
          </div>
          <DialogFooter className="pt-6 border-t gap-2">
            <Button variant="ghost" className="rounded-xl font-bold uppercase tracking-widest text-[10px] h-12 px-8" onClick={() => setEditingRow(null)}>Cancel</Button>
            <Button className="bg-slate-900 text-white rounded-xl font-black uppercase tracking-widest text-[10px] h-12 px-8 hover:bg-primary transition-all" onClick={() => updateTableRow(selectedTable, editingRow)}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Certificate of Ownership Modal */}
      <Dialog open={!!selectedCertificate} onOpenChange={(open) => !open && setSelectedCertificate(null)}>
        <DialogContent className="max-w-4xl p-0 bg-white border-none shadow-2xl overflow-hidden rounded-[2rem] print:shadow-none print:rounded-none">
          <div id="certificate-content" className="relative p-1 bg-[#f9fafb] print:bg-white min-h-[700px]">
            {/* The Formal Decorative Border (SVG based for precision) */}
            <div className="absolute inset-4 border-[12px] border-[#2c3e50]/10 rounded-sm pointer-events-none" />
            <div className="absolute inset-8 border-2 border-[#2c3e50]/20 rounded-sm pointer-events-none" />

            {/* Corner Ornaments */}
            <div className="absolute top-6 left-6 h-12 w-12 border-t-4 border-l-4 border-[#2c3e50] opacity-30" />
            <div className="absolute top-6 right-6 h-12 w-12 border-t-4 border-r-4 border-[#2c3e50] opacity-30" />
            <div className="absolute bottom-6 left-6 h-12 w-12 border-b-4 border-l-4 border-[#2c3e50] opacity-30" />
            <div className="absolute bottom-6 right-6 h-12 w-12 border-b-4 border-r-4 border-[#2c3e50] opacity-30" />

            <div className="relative z-10 px-20 py-16 space-y-10">
              {/* Top Header Section */}
              <div className="flex justify-between items-start">
                <div className="space-y-1 opacity-60">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#2c3e50]">Registration No: CPH-RES-2025-{(selectedCertificate?.id || '46829').slice(0, 5).toUpperCase()}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#2c3e50]">Title Reference: 463802-482569</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#2c3e50]">Land Registry Office: ESTATEHUB DISTRICT REGISTRY</p>
                </div>

                <div className="text-center">
                  <div className="flex flex-col items-center">
                    <div className="h-12 w-12 bg-[#1e293b] flex items-center justify-center rounded-lg shadow-lg mb-2">
                      <svg viewBox="0 0 24 24" className="w-8 h-8 text-primary fill-current">
                        <path d="M5 16L3 5L8.5 10L12 4L15.5 10L21 5L19 16H5M19 19C19 19.6 18.6 20 18 20H6C5.4 20 5 19.6 5 19V18H19V19Z" />
                      </svg>
                    </div>
                    <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-[#1e293b]">Crown Property</h4>
                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500">Registry Authority</p>
                  </div>
                </div>

                <div className="text-right space-y-1 opacity-60">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#2c3e50]">CROWN PROPERTY REGISTRY</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#2c3e50]">Land Registration Authority</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#2c3e50]">ESTABLISHED 2024, INDIA</p>
                </div>
              </div>

              {/* Main Title */}
              <div className="text-center space-y-2">
                <h1 className="text-6xl font-serif text-[#1e293b] italic tracking-tight font-light transition-all">
                  Property Ownership <span className="text-[#0ea5e9] not-italic font-bold">Certificate</span>
                </h1>
                <h2 className="text-2xl font-serif text-[#64748b] italic">
                  {selectedCertificate?.properties?.property_type || 'Residential'} Property
                </h2>
              </div>

              {/* Grant Section */}
              <div className="text-center space-y-6 py-4">
                <p className="text-lg font-serif text-slate-500 italic">Ownership is hereby granted to</p>
                <div className="relative inline-block">
                  <h3 className="text-5xl font-black text-[#1e293b] tracking-tighter uppercase mb-2">
                    {selectedCertificate?.buyer_name || selectedCertificate?.user_full_name || 'Verified Acquisition Member'}
                  </h3>
                  <div className="h-1 w-full bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
                </div>
                <p className="text-sm font-medium text-slate-500 max-w-2xl mx-auto leading-relaxed">
                  Who is the legal and rightful owner of the freehold residential property hereinafter described,
                  as registered with the Crown Property Registry in accordance with the Land Registration Act 2025.
                </p>
              </div>

              {/* Data Grid Section */}
              <div className="grid grid-cols-2 gap-12 bg-white/50 p-10 rounded-2xl border border-slate-100 shadow-sm backdrop-blur-sm">
                <div className="space-y-4">
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Property Address</span>
                    <span className="text-xs font-bold text-[#1e293b]">{selectedCertificate?.properties?.location}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Property Type</span>
                    <span className="text-xs font-bold text-[#2c3e50] uppercase">{selectedCertificate?.properties?.property_type} Dwelling</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Building Area</span>
                    <span className="text-xs font-bold text-[#2c3e50]">{selectedCertificate?.properties?.area} Square Metres</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Previous Owner</span>
                    <span className="text-xs font-bold text-[#2c3e50] italic">{selectedCertificate?.seller_name || selectedCertificate?.property_owner_name || 'Registry Estate'}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Date of Registration</span>
                    <span className="text-xs font-bold text-[#1e293b]">{new Date(selectedCertificate?.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Method of Acquisition</span>
                    <span className="text-xs font-bold text-[#2c3e50]">Purchase (Conveyance)</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Settle Value</span>
                    <span className="text-xs font-bold text-primary font-mono">{formatCurrency(selectedCertificate?.properties?.price || 0)}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Registry ID</span>
                    <span className="text-xs font-bold text-[#2c3e50] font-mono">{(selectedCertificate?.id || 'EST-HASH').toUpperCase()}</span>
                  </div>
                </div>
              </div>

              {/* Signatures & Seals */}
              <div className="flex justify-between items-end pt-8">
                <div className="text-center space-y-2">
                  <div className="h-10 w-48 border-b-2 border-slate-200 flex items-center justify-center italic text-slate-400 font-serif opacity-50">
                    Electronic Signature Activated
                  </div>
                  <h5 className="text-sm font-black text-[#1e293b]">Arvind K. Sharma</h5>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Deputy Registrar <br /> Crown Property Registry</p>
                </div>

                <div className="relative">
                  <div className="h-28 w-28 rounded-full border-4 border-double border-[#0ea5e9]/20 flex items-center justify-center relative scale-110 opacity-70">
                    <div className="absolute inset-1 rounded-full border border-[#0ea5e9]/10 animate-spin-slow" />
                    <div className="text-center">
                      <ShieldCheck className="h-8 w-8 text-[#0ea5e9] mx-auto mb-1" />
                      <p className="text-[7px] font-black text-[#0ea5e9] uppercase tracking-widest">Official<br />Registry Seal</p>
                    </div>
                  </div>
                </div>

                <div className="text-center space-y-2">
                  <div className="h-10 w-48 border-b-2 border-slate-200 flex items-center justify-center italic text-slate-400 font-serif opacity-50">
                    Official Seal Appended
                  </div>
                  <h5 className="text-sm font-black text-[#1e293b]">EstateHub Digital Authority</h5>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Chief Land Registrar <br /> Crown Property Registry</p>
                </div>
              </div>

              {/* Micro-text footer */}
              <div className="pt-8 border-t border-slate-100 text-center">
                <p className="text-[9px] text-slate-400 leading-relaxed font-medium">
                  This certificate is issued under the authority of the EstateHub Registry Act 2025 and serves as conclusive evidence of ownership.<br />
                  The title is guaranteed by the Crown Property Authority and is valid under the laws of the Republic of India.
                </p>
              </div>

              {/* Action Buttons (Hidden during print) */}
              <div className="pt-8 flex gap-4 print:hidden">
                <Button
                  className="flex-1 h-14 rounded-2xl bg-[#1e293b] hover:bg-black text-white font-black text-sm uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-2"
                  onClick={() => window.print()}
                >
                  <Printer className="h-5 w-5" /> Download / Print Certificate
                </Button>
                <Button
                  variant="ghost"
                  className="h-14 px-8 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-400 hover:text-slate-900"
                  onClick={() => setSelectedCertificate(null)}
                >
                  Close Document
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div >
  );
}
