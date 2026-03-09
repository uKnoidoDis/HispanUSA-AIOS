import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

// ---------------------------------------------------------------------------
// DELETE /api/availability/[id]
// Removes an unbooked slot. Returns 400 if the slot is booked.
// ---------------------------------------------------------------------------
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  if (!id) {
    return NextResponse.json({ error: 'Slot ID is required' }, { status: 400 });
  }

  const supabase = createServerClient();

  // Fetch the slot to confirm it exists and isn't booked
  const { data: slot, error: fetchError } = await supabase
    .from('availability_slots')
    .select('id, is_booked')
    .eq('id', id)
    .single();

  if (fetchError || !slot) {
    return NextResponse.json({ error: 'Slot not found' }, { status: 404 });
  }

  if (slot.is_booked) {
    return NextResponse.json(
      { error: 'Cannot delete a booked slot.' },
      { status: 400 }
    );
  }

  const { error: deleteError } = await supabase
    .from('availability_slots')
    .delete()
    .eq('id', id);

  if (deleteError) {
    console.error('[DELETE /api/availability/[id]]', deleteError);
    return NextResponse.json({ error: 'Failed to delete slot' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
