import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import TaskBoard from '@/components/board/TaskBoard';
import type { Task } from '@/types/task';

export default async function BoardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: false });

  return <TaskBoard initialTasks={(tasks as Task[]) ?? []} userEmail={user.email ?? ''} />;
}
