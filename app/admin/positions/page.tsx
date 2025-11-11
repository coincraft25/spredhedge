'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/navbar';
import { Sidebar } from '@/components/layout/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { getCurrentUser, getUserRole } from '@/lib/supabase/auth';
import {
  getVisiblePositions,
  createPosition,
  updatePosition,
  closePosition,
  archivePosition,
  togglePositionVisibility,
  updateMarketPrice,
} from '@/lib/supabase/positions';
import { Position } from '@/lib/supabase/types';
import {
  enrichPositionWithCalculations,
  formatCurrency,
  formatPercentage,
  getStatusColor,
  getPerformanceColor,
} from '@/lib/utils/position-calculations';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus,
  Edit,
  XCircle,
  Archive,
  Eye,
  EyeOff,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import { format } from 'date-fns';

interface PositionFormData {
  title: string;
  ticker: string;
  sector: string;
  status: 'Draft' | 'Live' | 'Closed' | 'Archived';
  visibility: 'admin_only' | 'members_view';
  entry_date: string;
  opened_date: string;
  entry_price: string;
  quantity: string;
  target_price: string;
  market_price: string;
  public_note: string;
  notes_admin: string;
  tags: string;
}

type PositionTab = 'live' | 'closed' | 'draft';

export default function AdminPositionsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>('');
  const [positions, setPositions] = useState<Position[]>([]);
  const [activeTab, setActiveTab] = useState<PositionTab>('live');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [isPriceUpdateOpen, setIsPriceUpdateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [closingPosition, setClosingPosition] = useState<Position | null>(null);
  const [priceUpdatePosition, setpriceUpdatePosition] = useState<Position | null>(null);
  const [newMarketPrice, setNewMarketPrice] = useState('');
  const [closeData, setCloseData] = useState({
    closing_price: '',
    closing_date: format(new Date(), 'yyyy-MM-dd'),
    public_note: '',
  });

  const [formData, setFormData] = useState<PositionFormData>({
    title: '',
    ticker: '',
    sector: '',
    status: 'Draft',
    visibility: 'admin_only',
    entry_date: format(new Date(), 'yyyy-MM-dd'),
    opened_date: '',
    entry_price: '',
    quantity: '',
    target_price: '',
    market_price: '',
    public_note: '',
    notes_admin: '',
    tags: '',
  });

  useEffect(() => {
    const savedTab = sessionStorage.getItem('positionsTab') as PositionTab | null;
    if (savedTab && ['live', 'closed', 'draft'].includes(savedTab)) {
      setActiveTab(savedTab);
    }
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { user } = await getCurrentUser();
    if (!user) {
      router.push('/login');
      return;
    }

    const role = await getUserRole(user.id);
    if (role !== 'admin') {
      router.push('/dashboard');
      return;
    }

    setUserId(user.id);
    await loadPositions();
    setLoading(false);
  };

  const loadPositions = async () => {
    const data = await getVisiblePositions('admin');
    setPositions(data);
  };

  const handleTabChange = useCallback((value: string) => {
    const tab = value as PositionTab;
    setActiveTab(tab);
    sessionStorage.setItem('positionsTab', tab);
  }, []);

  const handleMetricCardClick = useCallback((tab: PositionTab) => {
    setActiveTab(tab);
    sessionStorage.setItem('positionsTab', tab);
  }, []);

  const filteredPositions = positions.filter(p => {
    switch (activeTab) {
      case 'live':
        return p.status === 'Live';
      case 'closed':
        return p.status === 'Closed';
      case 'draft':
        return p.status === 'Draft';
      default:
        return true;
    }
  });

  const resetForm = () => {
    setFormData({
      title: '',
      ticker: '',
      sector: '',
      status: 'Draft',
      visibility: 'admin_only',
      entry_date: format(new Date(), 'yyyy-MM-dd'),
      opened_date: '',
      entry_price: '',
      quantity: '',
      target_price: '',
      market_price: '',
      public_note: '',
      notes_admin: '',
      tags: '',
    });
  };

  const handleCreate = async () => {
    try {
      const entryPrice = parseFloat(formData.entry_price);
      const quantity = parseFloat(formData.quantity);

      if (!formData.title || !entryPrice || !quantity) {
        toast({
          title: 'Validation Error',
          description: 'Please fill in all required fields',
          variant: 'destructive',
        });
        return;
      }

      const costBasis = entryPrice * quantity;
      const tags = formData.tags
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);

      await createPosition(
        {
          title: formData.title,
          ticker: formData.ticker || null,
          sector: formData.sector || null,
          status: formData.status,
          visibility: formData.visibility,
          entry_date: formData.entry_date,
          opened_date: formData.opened_date || null,
          entry_price: entryPrice,
          quantity: quantity,
          cost_basis: costBasis,
          target_price: formData.target_price ? parseFloat(formData.target_price) : null,
          market_price: formData.market_price ? parseFloat(formData.market_price) : null,
          price_updated_at: formData.market_price ? new Date().toISOString() : null,
          public_note: formData.public_note,
          notes_admin: formData.notes_admin,
          tags: tags,
        },
        userId
      );

      toast({
        title: 'Success',
        description: 'Position created successfully',
      });

      setIsCreateModalOpen(false);
      resetForm();
      await loadPositions();
    } catch (error) {
      console.error('Error creating position:', error);
      toast({
        title: 'Error',
        description: 'Failed to create position',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = async () => {
    if (!editingPosition) return;

    try {
      const entryPrice = parseFloat(formData.entry_price);
      const quantity = parseFloat(formData.quantity);
      const costBasis = entryPrice * quantity;
      const tags = formData.tags
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);

      await updatePosition(
        editingPosition.id,
        {
          title: formData.title,
          ticker: formData.ticker || null,
          sector: formData.sector || null,
          status: formData.status,
          visibility: formData.visibility,
          entry_date: formData.entry_date,
          opened_date: formData.opened_date || null,
          entry_price: entryPrice,
          quantity: quantity,
          cost_basis: costBasis,
          target_price: formData.target_price ? parseFloat(formData.target_price) : null,
          market_price: formData.market_price ? parseFloat(formData.market_price) : null,
          price_updated_at: formData.market_price ? new Date().toISOString() : null,
          public_note: formData.public_note,
          notes_admin: formData.notes_admin,
          tags: tags,
        },
        userId,
        'Position details updated'
      );

      toast({
        title: 'Success',
        description: 'Position updated successfully',
      });

      setIsEditModalOpen(false);
      setEditingPosition(null);
      resetForm();
      await loadPositions();
    } catch (error) {
      console.error('Error updating position:', error);
      toast({
        title: 'Error',
        description: 'Failed to update position',
        variant: 'destructive',
      });
    }
  };

  const handleClose = async () => {
    if (!closingPosition) return;

    try {
      const closingPrice = parseFloat(closeData.closing_price);

      if (!closingPrice || !closeData.closing_date) {
        toast({
          title: 'Validation Error',
          description: 'Please fill in closing price and date',
          variant: 'destructive',
        });
        return;
      }

      await closePosition(
        closingPosition.id,
        closingPrice,
        closeData.closing_date,
        userId,
        closeData.public_note
      );

      toast({
        title: 'Success',
        description: 'Position closed successfully',
      });

      setIsCloseModalOpen(false);
      setClosingPosition(null);
      setCloseData({
        closing_price: '',
        closing_date: format(new Date(), 'yyyy-MM-dd'),
        public_note: '',
      });
      await loadPositions();
    } catch (error) {
      console.error('Error closing position:', error);
      toast({
        title: 'Error',
        description: 'Failed to close position',
        variant: 'destructive',
      });
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await archivePosition(id, userId);
      toast({
        title: 'Success',
        description: 'Position archived',
      });
      await loadPositions();
    } catch (error) {
      console.error('Error archiving position:', error);
      toast({
        title: 'Error',
        description: 'Failed to archive position',
        variant: 'destructive',
      });
    }
  };

  const handleToggleVisibility = async (position: Position) => {
    try {
      const newVisibility =
        position.visibility === 'members_view' ? 'admin_only' : 'members_view';

      await togglePositionVisibility(position.id, newVisibility, userId);

      toast({
        title: 'Success',
        description: `Position ${newVisibility === 'members_view' ? 'published' : 'unpublished'}`,
      });

      await loadPositions();
    } catch (error) {
      console.error('Error toggling visibility:', error);
      toast({
        title: 'Error',
        description: 'Failed to update visibility',
        variant: 'destructive',
      });
    }
  };

  const handleUpdatePrice = async () => {
    if (!priceUpdatePosition) return;

    try {
      const marketPrice = parseFloat(newMarketPrice);

      if (!marketPrice || marketPrice <= 0) {
        toast({
          title: 'Validation Error',
          description: 'Please enter a valid price',
          variant: 'destructive',
        });
        return;
      }

      await updateMarketPrice(priceUpdatePosition.id, marketPrice, userId);

      toast({
        title: 'Success',
        description: 'Market price updated',
      });

      setIsPriceUpdateOpen(false);
      setpriceUpdatePosition(null);
      setNewMarketPrice('');
      await loadPositions();
    } catch (error) {
      console.error('Error updating price:', error);
      toast({
        title: 'Error',
        description: 'Failed to update price',
        variant: 'destructive',
      });
    }
  };

  const openEditModal = (position: Position) => {
    setEditingPosition(position);
    setFormData({
      title: position.title,
      ticker: position.ticker || '',
      sector: position.sector || '',
      status: position.status,
      visibility: position.visibility,
      entry_date: position.entry_date,
      opened_date: position.opened_date || '',
      entry_price: position.entry_price.toString(),
      quantity: position.quantity.toString(),
      target_price: position.target_price?.toString() || '',
      market_price: position.market_price?.toString() || '',
      public_note: position.public_note,
      notes_admin: position.notes_admin,
      tags: position.tags.join(', '),
    });
    setIsEditModalOpen(true);
  };

  const openCloseModal = (position: Position) => {
    setClosingPosition(position);
    setCloseData({
      closing_price: position.market_price?.toString() || '',
      closing_date: format(new Date(), 'yyyy-MM-dd'),
      public_note: position.public_note,
    });
    setIsCloseModalOpen(true);
  };

  const openPriceUpdateModal = (position: Position) => {
    setpriceUpdatePosition(position);
    setNewMarketPrice(position.market_price?.toString() || '');
    setIsPriceUpdateOpen(true);
  };

  if (loading) {
    return (
      <>
        <Navbar userRole="admin" />
        <div className="flex">
          <Sidebar role="admin" />
          <main className="flex-1 p-8 bg-white">
            <div className="flex items-center justify-center h-96">
              <p className="text-slate-600">Loading...</p>
            </div>
          </main>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar userRole="admin" />
      <div className="flex">
        <Sidebar role="admin" />
        <main className="flex-1 p-8 bg-white">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-slate-900 mb-2">
                  Position Manager
                </h1>
                <p className="text-slate-600">
                  Create and manage portfolio positions with full visibility control
                </p>
              </div>
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Position
              </Button>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-slate-600 mb-1">Total Positions</p>
                  <p className="text-3xl font-bold text-slate-900">
                    {positions.length}
                  </p>
                </CardContent>
              </Card>
              <Card
                className="cursor-pointer transition-all hover:shadow-md hover:border-emerald-300"
                onClick={() => handleMetricCardClick('live')}
              >
                <CardContent className="pt-6">
                  <p className="text-sm text-slate-600 mb-1">Live</p>
                  <p className="text-3xl font-bold text-emerald-600">
                    {positions.filter(p => p.status === 'Live').length}
                  </p>
                </CardContent>
              </Card>
              <Card
                className="cursor-pointer transition-all hover:shadow-md hover:border-blue-300"
                onClick={() => handleMetricCardClick('closed')}
              >
                <CardContent className="pt-6">
                  <p className="text-sm text-slate-600 mb-1">Closed</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {positions.filter(p => p.status === 'Closed').length}
                  </p>
                </CardContent>
              </Card>
              <Card
                className="cursor-pointer transition-all hover:shadow-md hover:border-slate-300"
                onClick={() => handleMetricCardClick('draft')}
              >
                <CardContent className="pt-6">
                  <p className="text-sm text-slate-600 mb-1">Draft</p>
                  <p className="text-3xl font-bold text-slate-400">
                    {positions.filter(p => p.status === 'Draft').length}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <TabsList className="grid w-full max-w-md grid-cols-3">
                <TabsTrigger value="live" className="relative">
                  Live
                  {positions.filter(p => p.status === 'Live').length > 0 && (
                    <Badge className="ml-2 bg-emerald-600 text-white text-xs">
                      {positions.filter(p => p.status === 'Live').length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="closed" className="relative">
                  Closed
                  {positions.filter(p => p.status === 'Closed').length > 0 && (
                    <Badge className="ml-2 bg-blue-600 text-white text-xs">
                      {positions.filter(p => p.status === 'Closed').length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="draft" className="relative">
                  Draft
                  {positions.filter(p => p.status === 'Draft').length > 0 && (
                    <Badge className="ml-2 bg-slate-400 text-white text-xs">
                      {positions.filter(p => p.status === 'Draft').length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="live">
                <Card>
                  <CardHeader>
                    <CardTitle>Live Positions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {filteredPositions.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Ticker</TableHead>
                            <TableHead>Visibility</TableHead>
                            <TableHead>Opened</TableHead>
                            <TableHead>Entry</TableHead>
                            <TableHead>Current</TableHead>
                            <TableHead>Performance</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredPositions.map(position => {
                            const enriched = enrichPositionWithCalculations(position);
                            return (
                              <TableRow key={position.id}>
                                <TableCell className="font-medium">
                                  {position.title}
                                </TableCell>
                                <TableCell>
                                  {position.ticker && (
                                    <Badge variant="outline" className="font-mono">
                                      {position.ticker}
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Badge variant={position.visibility === 'members_view' ? 'default' : 'secondary'}>
                                    {position.visibility === 'members_view' ? 'Public' : 'Private'}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {position.opened_date
                                    ? format(new Date(position.opened_date), 'MMM dd, yyyy')
                                    : 'N/A'}
                                </TableCell>
                                <TableCell>{formatCurrency(position.entry_price)}</TableCell>
                                <TableCell>
                                  {position.market_price
                                    ? formatCurrency(position.market_price)
                                    : 'N/A'}
                                </TableCell>
                                <TableCell>
                                  <span className={getPerformanceColor(enriched.performance_pct)}>
                                    {formatPercentage(enriched.performance_pct)}
                                  </span>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => openPriceUpdateModal(position)}
                                      title="Update price"
                                    >
                                      <DollarSign className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleToggleVisibility(position)}
                                      title="Toggle visibility"
                                    >
                                      {position.visibility === 'members_view' ? (
                                        <Eye className="h-4 w-4" />
                                      ) : (
                                        <EyeOff className="h-4 w-4" />
                                      )}
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => openEditModal(position)}
                                      title="Edit position"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => openCloseModal(position)}
                                      title="Close position"
                                    >
                                      <XCircle className="h-4 w-4 text-blue-600" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-12">
                        <p className="text-slate-500 mb-2">No live positions</p>
                        <p className="text-sm text-slate-400">Create a new position or activate a draft</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="closed">
                <Card>
                  <CardHeader>
                    <CardTitle>Closed Positions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {filteredPositions.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Ticker</TableHead>
                            <TableHead>Opened</TableHead>
                            <TableHead>Entry</TableHead>
                            <TableHead>Closing</TableHead>
                            <TableHead>Realized P&L</TableHead>
                            <TableHead>Closed Date</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredPositions.map(position => {
                            return (
                              <TableRow key={position.id}>
                                <TableCell className="font-medium">
                                  {position.title}
                                </TableCell>
                                <TableCell>
                                  {position.ticker && (
                                    <Badge variant="outline" className="font-mono">
                                      {position.ticker}
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {position.opened_date
                                    ? format(new Date(position.opened_date), 'MMM dd, yyyy')
                                    : 'N/A'}
                                </TableCell>
                                <TableCell>{formatCurrency(position.entry_price)}</TableCell>
                                <TableCell>
                                  {position.closing_price
                                    ? formatCurrency(position.closing_price)
                                    : 'N/A'}
                                </TableCell>
                                <TableCell>
                                  <span className={getPerformanceColor(position.realized_pnl || 0)}>
                                    {formatCurrency(position.realized_pnl || 0)}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  {position.closing_date
                                    ? format(new Date(position.closing_date), 'MMM dd, yyyy')
                                    : 'N/A'}
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => openEditModal(position)}
                                      title="Edit position"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleArchive(position.id)}
                                      title="Archive position"
                                    >
                                      <Archive className="h-4 w-4 text-slate-600" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-12">
                        <p className="text-slate-500 mb-2">No closed positions</p>
                        <p className="text-sm text-slate-400">Close a live position to see it here</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="draft">
                <Card>
                  <CardHeader>
                    <CardTitle>Draft Positions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {filteredPositions.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Ticker</TableHead>
                            <TableHead>Visibility</TableHead>
                            <TableHead>Entry</TableHead>
                            <TableHead>Target</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredPositions.map(position => {
                            return (
                              <TableRow key={position.id}>
                                <TableCell className="font-medium">
                                  {position.title}
                                </TableCell>
                                <TableCell>
                                  {position.ticker && (
                                    <Badge variant="outline" className="font-mono">
                                      {position.ticker}
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Badge variant={position.visibility === 'members_view' ? 'default' : 'secondary'}>
                                    {position.visibility === 'members_view' ? 'Public' : 'Private'}
                                  </Badge>
                                </TableCell>
                                <TableCell>{formatCurrency(position.entry_price)}</TableCell>
                                <TableCell>
                                  {position.target_price
                                    ? formatCurrency(position.target_price)
                                    : 'N/A'}
                                </TableCell>
                                <TableCell>
                                  {format(new Date(position.created_at), 'MMM dd, yyyy')}
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleToggleVisibility(position)}
                                      title="Toggle visibility"
                                    >
                                      {position.visibility === 'members_view' ? (
                                        <Eye className="h-4 w-4" />
                                      ) : (
                                        <EyeOff className="h-4 w-4" />
                                      )}
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => openEditModal(position)}
                                      title="Edit position"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleArchive(position.id)}
                                      title="Archive position"
                                    >
                                      <Archive className="h-4 w-4 text-slate-600" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-12">
                        <p className="text-slate-500 mb-2">No draft positions</p>
                        <p className="text-sm text-slate-400">Create a new position to get started</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>

      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Position</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Title *</Label>
                <Input
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., NVIDIA Corporation"
                />
              </div>
              <div>
                <Label>Ticker</Label>
                <Input
                  value={formData.ticker}
                  onChange={e => setFormData({ ...formData, ticker: e.target.value })}
                  placeholder="e.g., NVDA"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Sector</Label>
                <Input
                  value={formData.sector}
                  onChange={e => setFormData({ ...formData, sector: e.target.value })}
                  placeholder="e.g., Technology"
                />
              </div>
              <div>
                <Label>Entry Date *</Label>
                <Input
                  type="date"
                  value={formData.entry_date}
                  onChange={e => setFormData({ ...formData, entry_date: e.target.value })}
                />
              </div>
              <div>
                <Label>Opened Date</Label>
                <Input
                  type="date"
                  value={formData.opened_date}
                  onChange={e => setFormData({ ...formData, opened_date: e.target.value })}
                  placeholder="Auto-set when Live"
                />
                <p className="text-xs text-slate-500 mt-1">Auto-set when status is Live</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Entry Price *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.entry_price}
                  onChange={e => setFormData({ ...formData, entry_price: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label>Quantity *</Label>
                <Input
                  type="number"
                  step="0.00000001"
                  value={formData.quantity}
                  onChange={e => setFormData({ ...formData, quantity: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div>
                <Label>Cost Basis</Label>
                <Input
                  value={
                    formData.entry_price && formData.quantity
                      ? formatCurrency(
                          parseFloat(formData.entry_price) * parseFloat(formData.quantity)
                        )
                      : '---'
                  }
                  disabled
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Target Price</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.target_price}
                  onChange={e => setFormData({ ...formData, target_price: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label>Market Price</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.market_price}
                  onChange={e => setFormData({ ...formData, market_price: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Draft">Draft</SelectItem>
                    <SelectItem value="Live">Live</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Visibility</Label>
                <Select
                  value={formData.visibility}
                  onValueChange={(value: any) => setFormData({ ...formData, visibility: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin_only">Admin Only</SelectItem>
                    <SelectItem value="members_view">Members View</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Public Note</Label>
              <Textarea
                value={formData.public_note}
                onChange={e => setFormData({ ...formData, public_note: e.target.value })}
                placeholder="Brief description visible to members"
                rows={2}
              />
            </div>

            <div>
              <Label>Admin Notes</Label>
              <Textarea
                value={formData.notes_admin}
                onChange={e => setFormData({ ...formData, notes_admin: e.target.value })}
                placeholder="Internal notes (admin only)"
                rows={2}
              />
            </div>

            <div>
              <Label>Tags (comma separated)</Label>
              <Input
                value={formData.tags}
                onChange={e => setFormData({ ...formData, tags: e.target.value })}
                placeholder="e.g., ai, semiconductors, growth"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate}>Create Position</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Position</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Title *</Label>
                <Input
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div>
                <Label>Ticker</Label>
                <Input
                  value={formData.ticker}
                  onChange={e => setFormData({ ...formData, ticker: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Sector</Label>
                <Input
                  value={formData.sector}
                  onChange={e => setFormData({ ...formData, sector: e.target.value })}
                />
              </div>
              <div>
                <Label>Entry Date *</Label>
                <Input
                  type="date"
                  value={formData.entry_date}
                  onChange={e => setFormData({ ...formData, entry_date: e.target.value })}
                />
              </div>
              <div>
                <Label>Opened Date</Label>
                <Input
                  type="date"
                  value={formData.opened_date}
                  onChange={e => setFormData({ ...formData, opened_date: e.target.value })}
                  disabled={!!editingPosition?.opened_date}
                />
                <p className="text-xs text-slate-500 mt-1">
                  {editingPosition?.opened_date ? 'Set when first opened' : 'Auto-set when Live'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Entry Price *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.entry_price}
                  onChange={e => setFormData({ ...formData, entry_price: e.target.value })}
                />
              </div>
              <div>
                <Label>Quantity *</Label>
                <Input
                  type="number"
                  step="0.00000001"
                  value={formData.quantity}
                  onChange={e => setFormData({ ...formData, quantity: e.target.value })}
                />
              </div>
              <div>
                <Label>Cost Basis</Label>
                <Input
                  value={
                    formData.entry_price && formData.quantity
                      ? formatCurrency(
                          parseFloat(formData.entry_price) * parseFloat(formData.quantity)
                        )
                      : '---'
                  }
                  disabled
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Target Price</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.target_price}
                  onChange={e => setFormData({ ...formData, target_price: e.target.value })}
                />
              </div>
              <div>
                <Label>Market Price</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.market_price}
                  onChange={e => setFormData({ ...formData, market_price: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Draft">Draft</SelectItem>
                    <SelectItem value="Live">Live</SelectItem>
                    <SelectItem value="Closed">Closed</SelectItem>
                    <SelectItem value="Archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Visibility</Label>
                <Select
                  value={formData.visibility}
                  onValueChange={(value: any) => setFormData({ ...formData, visibility: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin_only">Admin Only</SelectItem>
                    <SelectItem value="members_view">Members View</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Public Note</Label>
              <Textarea
                value={formData.public_note}
                onChange={e => setFormData({ ...formData, public_note: e.target.value })}
                rows={2}
              />
            </div>

            <div>
              <Label>Admin Notes</Label>
              <Textarea
                value={formData.notes_admin}
                onChange={e => setFormData({ ...formData, notes_admin: e.target.value })}
                rows={2}
              />
            </div>

            <div>
              <Label>Tags (comma separated)</Label>
              <Input
                value={formData.tags}
                onChange={e => setFormData({ ...formData, tags: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCloseModalOpen} onOpenChange={setIsCloseModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Close Position — Confirm</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Confirm closing price and notes. This action will mark the position as Closed and
              record realized performance.
            </p>

            {closingPosition && (
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-sm font-semibold text-slate-900 mb-2">
                  {closingPosition.title}
                </p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-slate-600">Entry: </span>
                    <span className="font-medium">{formatCurrency(closingPosition.entry_price)}</span>
                  </div>
                  <div>
                    <span className="text-slate-600">Quantity: </span>
                    <span className="font-medium">{closingPosition.quantity}</span>
                  </div>
                </div>
              </div>
            )}

            <div>
              <Label>Closing Price *</Label>
              <Input
                type="number"
                step="0.01"
                value={closeData.closing_price}
                onChange={e => setCloseData({ ...closeData, closing_price: e.target.value })}
                placeholder="0.00"
              />
            </div>

            <div>
              <Label>Closing Date *</Label>
              <Input
                type="date"
                value={closeData.closing_date}
                onChange={e => setCloseData({ ...closeData, closing_date: e.target.value })}
              />
            </div>

            <div>
              <Label>Public Note (optional)</Label>
              <Textarea
                value={closeData.public_note}
                onChange={e => setCloseData({ ...closeData, public_note: e.target.value })}
                placeholder="Brief note about closing this position"
                rows={2}
              />
            </div>

            {closingPosition && closeData.closing_price && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900 mb-1">Realized P&L</p>
                <p className="text-2xl font-bold text-blue-900">
                  {formatCurrency(
                    (parseFloat(closeData.closing_price) - closingPosition.entry_price) *
                      closingPosition.quantity
                  )}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCloseModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleClose}>Confirm & Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isPriceUpdateOpen} onOpenChange={setIsPriceUpdateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Market Price</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {priceUpdatePosition && (
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-sm font-semibold text-slate-900">
                  {priceUpdatePosition.title}
                </p>
              </div>
            )}

            <div>
              <Label>Market Price</Label>
              <Input
                type="number"
                step="0.01"
                value={newMarketPrice}
                onChange={e => setNewMarketPrice(e.target.value)}
                placeholder="0.00"
              />
              <p className="text-xs text-slate-500 mt-1">
                Price will be marked as updated on {format(new Date(), 'MMM dd, yyyy')}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPriceUpdateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdatePrice}>Update Price</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
