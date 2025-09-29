<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateStudentsTable extends Migration
{
    public function up()
    {
       Schema::create('students', function (Blueprint $table) {
            $table->id();
            $table->string('student_id')->unique();
            $table->string('first_name');
            $table->string('last_name');
            $table->string('course')->nullable();
            $table->string('year_level')->nullable();
            $table->string('address')->nullable();
            $table->string('barcode')->nullable();
            $table->timestamps();
        });

    }

    public function down()
    {
        Schema::dropIfExists('students');
    }
}
