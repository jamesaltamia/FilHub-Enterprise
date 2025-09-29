<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class CustomerController extends Controller
{
    public function findCustomer($id)
    {
        $file = storage_path('app/customer.csv'); // ✅ matches your folder

        if (!file_exists($file)) {
            return response()->json(['error' => 'Customer file not found'], 500);
        }

        if (($handle = fopen($file, 'r')) !== false) {
            while (($row = fgetcsv($handle)) !== false) {
                // Skip empty rows
                if (count($row) < 7) {
                    continue;
                }

                // Trim both the CSV values and the input ID
                if (trim($row[0]) === trim($id) || trim($row[6]) === trim($id)) {
                    fclose($handle);

                    return response()->json([
                        'student_id' => trim($row[0]),
                        'first_name' => trim($row[1]),
                        'last_name'  => trim($row[2]),
                        'course'     => trim($row[3]),
                        'year_level' => trim($row[4]),
                        'address'    => trim($row[5]),
                        'barcode'    => trim($row[6]),
                    ]);
                }
            }
            fclose($handle);
        }

        return response()->json(['error' => 'Customer not found'], 404);
    }
}