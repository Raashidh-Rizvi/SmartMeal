import axios from "axios";

const API = "http://127.0.0.1:8000/meal-schedules";

export const getMeals = () => axios.get(API + "/");

export const createMeal = (data) =>
    axios.post(API + "/", data);

export const updateMeal = (id, data) =>
    axios.put(`${API}/${id}`, data);

export const deleteMeal = (id) =>
    axios.delete(`${API}/${id}`);