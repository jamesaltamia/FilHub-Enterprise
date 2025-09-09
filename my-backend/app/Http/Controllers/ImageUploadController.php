<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ImageUploadController extends BaseApiController
{
    public function upload(Request $request)
    {
        $request->validate([
            'image' => 'required|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
        ]);

        try {
            $image = $request->file('image');
            
            if (!$image) {
                return $this->errorResponse('No image file provided', 400);
            }
            
            // Generate unique filename
            $filename = Str::uuid() . '.' . $image->getClientOriginalExtension();
            
            // Create images directory if it doesn't exist
            $imagesPath = storage_path('app/public/images');
            if (!file_exists($imagesPath)) {
                mkdir($imagesPath, 0755, true);
            }
            
            // Store in storage/app/public/images directory
            $path = $image->storeAs('images', $filename, 'public');
            
            // Generate full URL - use API route to serve images
            $url = url('api/storage/images/' . $filename);
            
            return $this->successResponse([
                'url' => $url,
                'path' => $path,
                'filename' => $filename
            ], 'Image uploaded successfully');
            
        } catch (\Exception $e) {
            \Log::error('Image upload error: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            return $this->errorResponse('Failed to upload image: ' . $e->getMessage(), 500);
        }
    }
}
