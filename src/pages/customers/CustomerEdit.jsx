import { getCustomer, updateCustomer } from "../../services/customersApi";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const CustomerEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    phone: "",
  });

  useEffect(() => {
    const loadCustomer = async () => {
      try {
        const customer = await getCustomer(id);
        setForm({ name: customer.name, phone: customer.phone });
      } catch (error) {
        console.error("Error loading customer:", error.message);
      }
    };
    loadCustomer();
  }, [id]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateCustomer(id, form);
      navigate("/customers");
    } catch (error) {
      console.error("Error updating customer:", error.message);
    }
  };

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Edit Customer</h1>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <input
          name="name"
          placeholder="Customer Name"
          value={form.name}
          onChange={handleChange}
          className="input"
          required
        />
        <input
          name="phone"
          placeholder="Phone Number"
          value={form.phone}
          onChange={handleChange}
          className="input"
          required
        />
        <button className="btn-primary">Update Customer</button>
      </form>
    </div>
  );
};

export default CustomerEdit;
