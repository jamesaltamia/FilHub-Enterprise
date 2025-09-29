import axios from "axios";

const API_URL = "http://127.0.0.1:8000/api"; // Laravel backend

export interface Student {
    student_id: string;
    first_name: string;
    last_name: string;
    course: string;
    year_level: string;
    address: string;
    barcode: string;
    last_order_date?: string | Date;
}

export const getAllStudents = async (): Promise<Student[]> => {
    const response = await axios.get(`${API_URL}/customers`);
    return response.data;
};

export const getStudentById = async (id: string): Promise<Student> => {
    const response = await axios.get(`${API_URL}/customer/${id}`);
    return response.data;
};