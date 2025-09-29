<?php

namespace App\Imports;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithChunkReading;
use App\Models\Student;

class StudentsImport implements ToCollection, WithHeadingRow, WithChunkReading
{
    public function collection(Collection $rows)
    {
        $data = [];
        foreach ($rows as $row) {
            // skip blanks
            if (empty($row['student_id'])) {
                continue;
            }
            $data[] = [
                'id_number' => (string) $row['student_id'],
                'first_name' => $row['first_name'] ?? '',
                'last_name' => $row['last_name'] ?? '',
                'course' => $row['course'] ?? '',
                'year_level' => $row['year_level'] ?? '',
                'contact_number' => $row['contact_number'] ?? '',
                'email' => $row['email'] ?? '',
                'address' => $row['address'] ?? '',
                'barcode' => $row['barcode'] ?? (string) $row['student_id'],
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        if (!empty($data)) {
            // upsert so existing students are updated
            Student::upsert($data, ['id_number'], [
                'first_name','last_name','course','year_level',
                'contact_number','email','address','barcode','updated_at'
            ]);
        }
    }

    public function chunkSize(): int
    {
        return 1000;
    }
}