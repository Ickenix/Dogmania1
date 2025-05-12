/*
  # Create dogs storage bucket

  1. New Storage Bucket
    - Creates a public bucket named 'dogs' for storing dog profile images
    - Enables public read access
    - Restricts write access to authenticated users

  2. Security
    - Enables RLS policies for secure access control
    - Allows authenticated users to upload their own dog images
    - Allows public read access to all images
*/

-- Create the dogs bucket
insert into storage.buckets (id, name, public)
values ('dogs', 'dogs', true);

-- Enable RLS
alter table storage.objects enable row level security;

-- Create policy to allow authenticated users to upload files
create policy "Authenticated users can upload dog images"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'dogs'
  and owner = auth.uid()
);

-- Create policy to allow public read access to all dog images
create policy "Public users can view dog images"
on storage.objects for select
to public
using (bucket_id = 'dogs');

-- Create policy to allow users to update their own images
create policy "Users can update their own dog images"
on storage.objects for update
to authenticated
using (bucket_id = 'dogs' and owner = auth.uid())
with check (bucket_id = 'dogs' and owner = auth.uid());

-- Create policy to allow users to delete their own images
create policy "Users can delete their own dog images"
on storage.objects for delete
to authenticated
using (bucket_id = 'dogs' and owner = auth.uid());