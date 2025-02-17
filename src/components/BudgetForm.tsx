"use client";
import { useState, useEffect } from "react";
import { Euro } from "lucide-react";
import Btn from "./ui/animated-subscribe-button";

export default function BudgetForm() {
  const [categories, setCategories] = useState<string[]>([]);
  const [budgets, setBudgets] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitStatus, setSubmitStatus] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategoriesAndBudgets = async () => {
      try {
        setIsLoading(true);
        const categoriesResponse = await fetch("/api/categories");
        const budgetsResponse = await fetch("/api/budgets");

        if (!categoriesResponse.ok || !budgetsResponse.ok) {
          throw new Error("Erreur lors de la récupération des données");
        }

        const categoriesData = await categoriesResponse.json();
        const budgetsData = await budgetsResponse.json();

        setCategories(categoriesData);

        // Convertir les budgets en objet avec la catégorie comme clé
        const budgetsObject = budgetsData.reduce(
          (
            acc: { [key: string]: string },
            budget: { category: string; amount: number }
          ) => {
            acc[budget.category] = budget.amount.toFixed(2); // Convertir en chaîne avec 2 décimales
            return acc;
          },
          {}
        );

        setBudgets(budgetsObject);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Une erreur est survenue"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategoriesAndBudgets();
  }, []);

  const handleBudgetChange = (category: string, value: string) => {
    // Permettre les nombres décimaux (avec point ou virgule) et les nombres négatifs
    const regex = /^-?\d*[.,]?\d*$/;
    if (value === "" || regex.test(value)) {
      // Remplacer la virgule par un point pour la cohérence interne
      const normalizedValue = value.replace(",", ".");
      setBudgets((prev) => ({ ...prev, [category]: normalizedValue }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitStatus(null);
    setError(null);

    try {
      const budgetsArray = Object.entries(budgets).map(
        ([category, amount]) => ({
          category,
          amount: parseFloat(amount) || 0, // Convertir en nombre, 0 si vide ou invalide
        })
      );

      const response = await fetch("/api/budgets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(budgetsArray),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Erreur lors de l'enregistrement des budgets"
        );
      }

      setSubmitStatus("Votre budget a été enregistré avec succès !");

      // Attendre un court instant avant de recharger la page
      setTimeout(() => {
        window.location.reload();
      }, 1500); // Recharge après 1.5 secondes
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Une erreur est survenue lors de l'enregistrement"
      );
    }
  };

  if (isLoading)
    return (
      <div className="text-white text-center">Chargement des données...</div>
    );
  if (error)
    return <div className="text-red-500 text-center">Erreur : {error}</div>;

  return (
    <div className="flex flex-col">
      <form onSubmit={handleSubmit} className="w-full">
        <h1 className="text-customColor-300 text-sm sm:text-md font-bold pt-2 sm:pt-4 pb-2 sm:pb-4">
          Visualisez et configurez vos budgets
        </h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {categories.map((category) => (
            <div
              key={category}
              className="bg-customColor-700 p-3 sm:p-4 rounded-lg"
            >
              <label
                htmlFor={`budget-${category}`}
                className="text-white text-base sm:text-lg font-medium block mb-1 sm:mb-2"
              >
                {category}
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="À définir"
                  id={`budget-${category}`}
                  value={budgets[category] || ""}
                  onChange={(e) => handleBudgetChange(category, e.target.value)}
                  className="w-full p-2 pl-7 sm:pl-8 rounded bg-customColor-600 text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <Euro
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 text-emerald-500"
                  size={16}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="text-center mt-8 sm:mt-12 lg:mt-16">
          <Btn text="Valider" />
        </div>
        {submitStatus && (
          <p className="text-green-500 text-center mt-4 text-sm sm:text-base">
            {submitStatus}
            <span className="ml-2">Mise à jour en cours...</span>
          </p>
        )}
        {error && (
          <p className="text-red-500 text-center mt-4 text-sm sm:text-base">
            {error}
          </p>
        )}
      </form>
    </div>
  );
}
