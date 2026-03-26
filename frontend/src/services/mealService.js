import axios from "axios";

const API = "http://127.0.0.1:8000/meal-schedules";

export const getMeals = (user_id = "1") => axios.get(API + "/", { params: { user_id } });

export const createMeal = (data) =>
    axios.post(API + "/", data);

export const updateMeal = (id, data) =>
    axios.put(`${API}/${id}`, data);

export const deleteMeal = (id) =>
    axios.delete(`${API}/${id}`);