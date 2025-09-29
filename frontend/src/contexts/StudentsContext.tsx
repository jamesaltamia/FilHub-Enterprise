import React, {
  createContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";

export interface Student {
  student_id: string;
  first_name: string;
  last_name: string;
  course: string;
  year_level: string;
  address: string;
  barcode: string;
}

interface StudentsContextType {
  students: Student[];
  addStudent: (student: Student) => void;
  updateStudent: (student: Student) => void;
  deleteStudent: (id: string) => void;
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
}

export const StudentsContext = createContext<StudentsContextType | undefined>(
  undefined
);

export const StudentsProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [students, setStudents] = useState<Student[]>([]);

  // Load students from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem("students");
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (Array.isArray(parsed)) setStudents(parsed);
      } catch (e) {
        console.error("Failed to parse students from localStorage", e);
      }
    }
  }, []);

  // Save to localStorage whenever students change
  useEffect(() => {
    localStorage.setItem("students", JSON.stringify(students));
  }, [students]);

  const addStudent = (student: Student) => {
    if (students.some((s) => s.student_id === student.student_id)) return;
    setStudents((prev) => [...prev, student]);
  };

  const updateStudent = (student: Student) => {
    setStudents((prev) =>
      prev.map((s) => (s.student_id === student.student_id ? student : s))
    );
  };

  const deleteStudent = (id: string) => {
    setStudents((prev) => prev.filter((s) => s.student_id !== id));
  };

  return (
    <StudentsContext.Provider
      value={{
        students,
        addStudent,
        updateStudent,
        deleteStudent,
        setStudents,
      }}
    >
      {children}
    </StudentsContext.Provider>
  );
};
