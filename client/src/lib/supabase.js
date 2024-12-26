import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Verify storage bucket exists
const verifyStorage = async () => {
  try {
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error accessing storage:', listError);
      throw listError;
    }

    const documentsBucket = buckets?.find(bucket => bucket.name === 'documents');
    if (!documentsBucket) {
      throw new Error('Documents bucket not found. Please create it in the Supabase dashboard.');
    }

    // Test bucket access
    const testFile = new Blob(['test'], { type: 'text/plain' });
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload('test.txt', testFile, { upsert: true });

    if (uploadError && !uploadError.message.includes('duplicate')) {
      console.error('Error testing bucket access:', uploadError);
      throw uploadError;
    }

    // Clean up test file
    await supabase.storage
      .from('documents')
      .remove(['test.txt'])
      .catch(console.error);

    console.log('Storage bucket verified and accessible');
    return true;
  } catch (error) {
    console.error('Storage verification failed:', error);
    throw error;
  }
};

// Verify storage when module loads
verifyStorage().catch(console.error);

export const uploadFileToSupabase = async (file, projectId) => {
  try {
    if (file.type !== 'application/pdf' && file.type !== 'image/svg+xml') {
      throw new Error('Only PDF and SVG files are supported');
    }

    // Verify storage access
    await verifyStorage();

    const fileExt = file.name.split('.').pop();
    const fileName = `${projectId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    console.log('Uploading file:', {
      fileName,
      fileType: file.type,
      fileSize: file.size,
      bucket: 'documents'
    });

    // Upload file
    const { data, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(fileName, file, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw uploadError;
    }

    console.log('File uploaded successfully:', data);

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(fileName);

    console.log('Generated public URL:', publicUrl);

    return {
      url: publicUrl,
      path: fileName,
      name: file.name,
      type: file.type,
      size: file.size
    };
  } catch (error) {
    console.error('Error uploading to Supabase:', error);
    throw error;
  }
}; 