import { Link, useNavigate } from "react-router-dom";
import {
  deactivateCustomer,
  listCustomers,
  reactivateCustomer,
} from "../../services/customersApi";
import { useEffect, useState } from "react";

const CustomerList = () => {
  const [customers, setCustomers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const data = await listCustomers();
        setCustomers(data);
      } catch (error) {
        console.error("Error loading customers:", error.message);
      }
    };
    loadCustomers();
  }, []);

  const handleDeactivate = async (id) => {
    try {
      await deactivateCustomer(id);

      // DO NOT remove customer — mark as deactivated
      setCustomers((prev) =>
        prev.map((customer) =>
          customer.id === id
            ? { ...customer, name: "[DEACTIVATED]" }
            : customer
        )
      );
    } catch (error) {
      console.error("Error deactivating customer:", error.message);
    }
  };

  const handleReactivate = async (id) => {
    try {
      const reactivatedCustomer = await reactivateCustomer(id);

      setCustomers((prev) =>
        prev.map((customer) =>
          customer.id === id ? reactivatedCustomer : customer
        )
      );
    } catch (error) {
      console.error("Error reactivating customer:", error.message);
    }
  };

  const handleCreate = () => {
    navigate("/customers/new");
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Customer List</h1>
        <button onClick={handleCreate} className="btn-primary">
          Create Customer
        </button>
      </div>

      {customers.length === 0 ? (
        <p>No customers found</p>
      ) : (
        <table className="w-full bg-white shadow rounded">
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => {
              const isDeactivated = customer.name === "[DEACTIVATED]";

              return (
                <tr key={customer.id} className={isDeactivated ? "opacity-60" : ""}>
                  <td>{customer.name}</td>
                  <td>{customer.phone}</td>
                  <td className="space-x-2">
                    <Link
                      to={`/customers/${customer.id}`}
                      className="btn-secondary"
                    >
                      View/Edit
                    </Link>

                    {!isDeactivated && (
                      <button
                        onClick={() => handleDeactivate(customer.id)}
                        className="btn-danger"
                      >
                        Deactivate
                      </button>
                    )}

                    {isDeactivated && (
                      <button
                        onClick={() => handleReactivate(customer.id)}
                        className="btn-success"
                      >
                        Reactivate
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default CustomerList;
