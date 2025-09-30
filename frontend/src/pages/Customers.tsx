import React, { useContext, useState, useRef } from "react";
import Papa from "papaparse";
import { StudentsContext, type Student } from "../contexts/StudentsContext";
import { useTheme } from "../contexts/ThemeContext";

const Customers: React.FC = () => {
  const context = useContext(StudentsContext);
  if (!context) throw new Error("StudentsContext is missing");

  const { students, addStudent, addMultipleStudents, updateStudent, deleteStudent } =
    context;
  
  const { theme } = useTheme();

  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isViewing, setIsViewing] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter by name or ID
  const filteredStudents = students.filter(
    (s) =>
      `${s.first_name} ${s.last_name}`
        .toLowerCase()
        .includes(search.toLowerCase()) || s.student_id.includes(search)
  );

  // CSV Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadStatus("Uploading...");

    Papa.parse(file, {
      header: false,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const parsedData = results.data as string[][];
          // Filter out empty rows
          const validRows = parsedData.filter(row => row.length >= 7 && row[0]?.trim());
          
          const mapped: Student[] = validRows.map((row) => ({
            student_id: row[0]?.trim() || "",
            first_name: row[1]?.trim() || "",
            last_name: row[2]?.trim() || "",
            course: row[3]?.trim() || "",
            year_level: row[4]?.trim() || "",
            address: row[5]?.trim() || "",
            barcode: row[6]?.trim() || "",
          }));

          // Use batch add function to properly handle localStorage saving
          addMultipleStudents(mapped);
          
          // Clear the file input using ref
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
          
          // Show success message
          setUploadStatus(`Successfully processed ${mapped.length} students from CSV file`);
          
          // Clear status after 5 seconds
          setTimeout(() => setUploadStatus(""), 5000);
        } catch (error) {
          console.error("Error processing CSV data:", error);
          setUploadStatus("Error processing CSV data");
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
          setTimeout(() => setUploadStatus(""), 3000);
        }
      },
      error: (error) => {
        console.error("CSV parsing error:", error);
        setUploadStatus("Error uploading file");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        setTimeout(() => setUploadStatus(""), 3000);
      }
    });
  };

  // Actions
  const handleAdd = () => {
    if (!selectedStudent) return;
    addStudent(selectedStudent);
    setIsAdding(false);
    setSelectedStudent(null);
  };

  const handleSave = () => {
    if (!selectedStudent) return;
    updateStudent(selectedStudent);
    setIsEditing(false);
    setSelectedStudent(null);
  };

  const handleDeleteClick = (id: string) => {
    if (window.confirm("Are you sure you want to delete this student?")) {
      deleteStudent(id);
    }
  };

  const handleView = (student: Student) => {
    setSelectedStudent(student);
    setIsViewing(true);
  };

  const handleEdit = (student: Student) => {
    setSelectedStudent(student);
    setIsEditing(true);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h1 className="text-2xl font-bold">Customers</h1>
          <span className="text-gray-600">
            Customers found: {filteredStudents.length}
          </span>
        </div>
        <div className="flex flex-col items-end mt-1">
          <button
            onClick={() => {
              setIsAdding(true);
              setSelectedStudent({
                student_id: "",
                first_name: "",
                last_name: "",
                course: "",
                year_level: "",
                address: "",
                barcode: "",
              });
            }}
            className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
          >
            Add Student
          </button>
        </div>
      </div>

      {/* Search + Upload */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex flex-col">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className={`border p-2 rounded ${
              theme === 'dark' 
                ? 'bg-gray-700 border-gray-600 text-gray-200' 
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          />
          {uploadStatus && (
            <span className={`text-sm mt-1 ${
              uploadStatus.includes("Error") ? "text-red-600" : 
              uploadStatus.includes("Successfully") ? "text-green-600" : 
              "text-blue-600"
            }`}>
              {uploadStatus}
            </span>
          )}
        </div>
        <input
          type="text"
          placeholder="Search by name or ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`border p-2 rounded w-64 ${
            theme === 'dark' 
              ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-400' 
              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
          }`}
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto shadow-md rounded-lg">
        <table className="table-auto border-collapse w-full text-left">
          <thead>
            <tr className="bg-gray-200 text-gray-700">
              <th className="p-2">ID</th>
              <th className="p-2">Name</th>
              <th className="p-2">Course</th>
              <th className="p-2">Year</th>
              <th className="p-2">Address</th>
              <th className="p-2">Barcode</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((s, idx) => (
              <tr key={idx} className="border-t hover:bg-gray-50">
                <td className="p-2">{s.student_id}</td>
                <td className="p-2">
                  {s.first_name} {s.last_name}
                </td>
                <td className="p-2">{s.course}</td>
                <td className="p-2">{s.year_level}</td>
                <td className="p-2">{s.address}</td>
                <td className="p-2">{s.barcode}</td>
                <td className="p-2 flex gap-2">
                  <button
                    onClick={() => handleView(s)}
                    className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    View
                  </button>
                  <button
                    onClick={() => handleEdit(s)}
                    className="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteClick(s.student_id)}
                    className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {filteredStudents.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center p-4 text-gray-500">
                  No students found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {(isAdding || isEditing) && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center">
          <div className="bg-white p-6 rounded shadow-lg w-96">
            <h2 className="text-xl font-bold mb-4">
              {isEditing ? "Edit Student" : "Add Student"}
            </h2>
            {[
              "student_id",
              "first_name",
              "last_name",
              "course",
              "year_level",
              "address",
              "barcode",
            ].map((field) => (
              <input
                key={field}
                type="text"
                className="border p-2 rounded mb-2 w-full"
                placeholder={field.replace("_", " ").toUpperCase()}
                value={selectedStudent[field as keyof Student]}
                onChange={(e) =>
                  setSelectedStudent({
                    ...selectedStudent,
                    [field]: e.target.value,
                  })
                }
              />
            ))}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setIsAdding(false);
                  setIsEditing(false);
                  setSelectedStudent(null);
                }}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={isEditing ? handleSave : handleAdd}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                {isEditing ? "Save" : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {isViewing && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center">
          <div className="bg-white p-6 rounded shadow-lg w-96">
            <h2 className="text-xl font-bold mb-4">View Student</h2>
            {Object.entries(selectedStudent).map(([key, value]) => (
              <p key={key}>
                <strong>{key.replace("_", " ").toUpperCase()}:</strong> {value}
              </p>
            ))}
            <div className="flex justify-end mt-4">
              <button
                onClick={() => {
                  setIsViewing(false);
                  setSelectedStudent(null);
                }}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
