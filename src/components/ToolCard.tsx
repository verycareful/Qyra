import { useNavigate } from "react-router-dom";

interface ToolCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  color?: string;
}

export function ToolCard({ title, description, icon, href, color = "blue" }: ToolCardProps) {
  const navigate = useNavigate();

  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
    green: "bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400",
    purple: "bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400",
    orange: "bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-400",
    red: "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400",
    teal: "bg-teal-50 text-teal-600 dark:bg-teal-950 dark:text-teal-400",
    indigo: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400",
    rose: "bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400",
    yellow: "bg-yellow-50 text-yellow-600 dark:bg-yellow-950 dark:text-yellow-400",
    gray: "bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  };

  return (
    <button
      onClick={() => navigate(href)}
      className="
        group flex flex-col items-start gap-3 p-4 rounded-xl border border-gray-200
        dark:border-gray-700 bg-white dark:bg-gray-800 text-left
        hover:border-blue-300 hover:shadow-md dark:hover:border-blue-700
        transition-all duration-150
      "
    >
      <div className={`p-2.5 rounded-lg ${colorMap[color] ?? colorMap.blue}`}>
        {icon}
      </div>
      <div>
        <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">{title}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>
      </div>
    </button>
  );
}
