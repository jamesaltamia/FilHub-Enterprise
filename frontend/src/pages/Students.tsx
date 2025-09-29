import { useEffect, useState } from "react";
import { getAllStudents, getStudentById, type Student } from "../services/students";

export default function Students() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [searchResult, setSearchResult] = useState<Student | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getAllStudents();
        setStudents(data);
      } catch (error) {
        console.error("Error fetching students:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSearch = async () => {
    try {
      const student = await getStudentById(query);
      setSearchResult(student);
    } catch {
      setSearchResult(null);
      alert("Student not found");
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Students</h1>

      {/* Search Box */}
      <div className="mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter Student ID or Barcode"
          className="border p-2 mr-2"
        />
        <button
          onClick={handleSearch}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Search
        </button>
      </div>

      {/* Search Result */}
      {searchResult && (
        <div className="mb-6 p-4 border bg-gray-100 rounded">
          <h2 className="text-lg font-bold mb-2">Search Result</h2>
          <p><b>ID:</b> {searchResult.student_id}</p>
          <p><b>Name:</b> {searchResult.first_name} {searchResult.last_name}</p>
          <p><b>Course:</b> {searchResult.course}</p>
          <p><b>Year:</b> {searchResult.year_level}</p>
          <p><b>Address:</b> {searchResult.address}</p>
        </div>
      )}

      {/* Table of All Students */}
      <table className="w-full border-collapse border">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2">ID</th>
            <th className="border p-2">Name</th>
            <th className="border p-2">Course</th>
            <th className="border p-2">Year</th>
            <th className="border p-2">Address</th>
          </tr>
        </thead>
        <tbody>
          {students.map((s) => (
            <tr key={s.student_id}>
              <td className="border p-2">{s.student_id}</td>
              <td className="border p-2">{s.first_name} {s.last_name}</td>
              <td className="border p-2">{s.course}</td>
              <td className="border p-2">{s.year_level}</td>
              <td className="border p-2">{s.address}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}