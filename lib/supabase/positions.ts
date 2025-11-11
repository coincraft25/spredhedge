import { supabase } from './client';
import { Position, AuditLog } from './types';

export async function getVisiblePositions(userRole: 'admin' | 'investor') {
  let query = supabase
    .from('positions')
    .select('*')
    .order('entry_date', { ascending: false });

  if (userRole === 'investor') {
    query = query
      .eq('status', 'Live')
      .eq('visibility', 'members_view');
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching positions:', error);
    return [];
  }

  return data as Position[];
}

export async function getPositionById(id: string) {
  const { data, error } = await supabase
    .from('positions')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('Error fetching position:', error);
    return null;
  }

  return data as Position | null;
}

export async function createPosition(position: Partial<Position>, userId: string) {
  const positionData = {
    ...position,
    created_by: userId,
    updated_by: userId,
    opened_date: position.status === 'Live' ? (position.entry_date || new Date().toISOString().split('T')[0]) : null,
  };

  const { data, error } = await supabase
    .from('positions')
    .insert(positionData)
    .select()
    .single();

  if (error) {
    console.error('Error creating position:', error);
    throw error;
  }

  await logAudit({
    action: 'create',
    position_id: data.id,
    user_id: userId,
    diff_summary: 'Initial position created',
    notes: `Position opened: ${position.title}`,
  });

  return data as Position;
}

export async function updatePosition(
  id: string,
  updates: Partial<Position>,
  userId: string,
  diffSummary?: string
) {
  const currentPosition = await getPositionById(id);

  const updateData = {
    ...updates,
    updated_by: userId,
    updated_at: new Date().toISOString(),
  };

  if (currentPosition && !currentPosition.opened_date && updates.status === 'Live') {
    updateData.opened_date = updates.entry_date || currentPosition.entry_date || new Date().toISOString().split('T')[0];
  }

  const { data, error } = await supabase
    .from('positions')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating position:', error);
    throw error;
  }

  await logAudit({
    action: 'edit',
    position_id: id,
    user_id: userId,
    diff_summary: diffSummary || 'Position updated',
    notes: null,
  });

  return data as Position;
}

export async function closePosition(
  id: string,
  closingPrice: number,
  closingDate: string,
  userId: string,
  publicNote?: string
) {
  const position = await getPositionById(id);
  if (!position) {
    throw new Error('Position not found');
  }

  const realized_pnl = (closingPrice - position.entry_price) * position.quantity;

  const updates: Partial<Position> = {
    status: 'Closed',
    closing_price: closingPrice,
    closing_date: closingDate,
    realized_pnl: realized_pnl,
    updated_by: userId,
  };

  if (publicNote) {
    updates.public_note = publicNote;
  }

  const { data, error } = await supabase
    .from('positions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error closing position:', error);
    throw error;
  }

  await logAudit({
    action: 'close',
    position_id: id,
    user_id: userId,
    diff_summary: `Position closed at ${closingPrice}`,
    notes: `Realized P&L: ${realized_pnl.toFixed(2)}`,
  });

  return data as Position;
}

export async function archivePosition(id: string, userId: string) {
  const { data, error } = await supabase
    .from('positions')
    .update({
      status: 'Archived',
      updated_by: userId,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error archiving position:', error);
    throw error;
  }

  await logAudit({
    action: 'archive',
    position_id: id,
    user_id: userId,
    diff_summary: 'Position archived',
    notes: null,
  });

  return data as Position;
}

export async function togglePositionVisibility(
  id: string,
  visibility: 'admin_only' | 'members_view',
  userId: string
) {
  const action = visibility === 'members_view' ? 'publish' : 'unpublish';

  const { data, error } = await supabase
    .from('positions')
    .update({
      visibility,
      updated_by: userId,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating position visibility:', error);
    throw error;
  }

  await logAudit({
    action,
    position_id: id,
    user_id: userId,
    diff_summary: `Visibility changed to ${visibility}`,
    notes: null,
  });

  return data as Position;
}

export async function updateMarketPrice(
  id: string,
  marketPrice: number,
  userId: string
) {
  const { data, error } = await supabase
    .from('positions')
    .update({
      market_price: marketPrice,
      price_updated_at: new Date().toISOString(),
      updated_by: userId,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating market price:', error);
    throw error;
  }

  return data as Position;
}

export async function getAuditLogs(positionId?: string) {
  let query = supabase
    .from('audit_log')
    .select('*')
    .order('timestamp', { ascending: false });

  if (positionId) {
    query = query.eq('position_id', positionId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching audit logs:', error);
    return [];
  }

  return data as AuditLog[];
}

async function logAudit(log: Omit<AuditLog, 'id' | 'timestamp'>) {
  const { error } = await supabase.from('audit_log').insert(log);

  if (error) {
    console.error('Error logging audit:', error);
  }
}
