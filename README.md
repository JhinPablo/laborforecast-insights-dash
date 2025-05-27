# LaborForecast Insights Dashboard

LaborForecast Insights Dashboard es una aplicación web basada en React que proporciona análisis y visualizaciones interactivas para datos de la fuerza laboral. El sistema procesa datos demográficos históricos, estadísticas de población y predicciones laborales para generar insights mediante gráficos, mapas e informes.

## 📌 Descripción General

Este documento describe la arquitectura del sistema, sus componentes principales, navegación, flujo de datos y estructura de acceso por usuario.

## 📁 Archivos Fuente Relevantes

* `src/App.tsx`: 1–35
* `src/pages/Dashboard.tsx`: 1–65
* `src/pages/Index.tsx`: 1–236
* `package.json`: segmentos varios para tecnologías y scripts
* `src/components/dashboard/EuropeVectorMap.tsx`
* `src/components/dashboard/PredictionMap.tsx`
* `src/components/dashboard/PredictionsReports.tsx`
* `src/components/dashboard/ReportsSection.tsx`
* `src/components/dashboard/SimpleReports.tsx`
* `src/components/ui/tabs.tsx`

## 🎯 Propósito y Alcance

La aplicación está diseñada para soportar:

* Análisis históricos
* Generación de informes (PDF, CSV)
* Mapas de pronóstico interactivos
* Acceso a funcionalidades según el plan de suscripción

## 🏗️ Arquitectura de la Aplicación

La aplicación está construida como una SPA con React y TypeScript. Utiliza:

* **React Router**: navegación
* **React Query (TanStack)**: gestión del estado del servidor
* **Supabase**: autenticación y base de datos
* **Recharts & React Simple Maps**: visualización de datos

### Componentes por Plan

* **FreePlan**: Vista básica
* **SilverPlan**: Gráficos interactivos
* **GoldPlan**: Suite de análisis avanzada

### Secciones del Dashboard

* `SimpleReports`: análisis histórico
* `ReportsSection`: exportación PDF/CSV
* `PredictionsReports`: mapas de predicción

### Proveedores del Sistema

* `QueryClientProvider`: gestión de datos
* `AuthProvider`: autenticación
* `TooltipProvider`: tooltips e interfaz

### Puntos de Entrada

| Archivo         | Propósito            |
| --------------- | -------------------- |
| `App.tsx`       | Router + Providers   |
| `Index.tsx`     | Página de inicio     |
| `AuthPage`      | Formularios de login |
| `Dashboard.tsx` | Lógica principal     |

![Arquitectura de componentes](docs/img/architecture-components.png)

## 🧭 Jerarquía de Componentes y Navegación

La navegación se gestiona a través del estado `activeSection` en `Dashboard.tsx`, que renderiza una de las tres secciones principales:

* `dashboard`: `SimpleReports`
* `reports`: `ReportsSection`
* `predictions`: `PredictionsReports`

Incluye protecciones de autenticación mediante los hooks `useAuth()` y `useProfile()`.

![Flujo de navegación y autenticación](docs/img/navigation-auth-flow.png)

## 🧰 Tecnologías Utilizadas

| Categoría          | Tecnologías                | Propósito                  |
| ------------------ | -------------------------- | -------------------------- |
| Framework Frontend | React 18, TypeScript, Vite | Desarrollo del núcleo      |
| Routing            | React Router DOM           | Navegación                 |
| Estado             | React Query (TanStack)     | Estado del servidor        |
| Autenticación      | Supabase Auth              | Gestión de usuarios        |
| Base de Datos      | Supabase PostgreSQL        | Almacenamiento y consultas |
| UI                 | Radix UI, Tailwind CSS     | Estilo y diseño            |
| Visualización      | Recharts                   | Gráficos                   |
| Mapas              | React Simple Maps          | Mapas interactivos         |
| Exportación        | jsPDF, html2canvas         | Exportación de informes    |
| Formularios        | React Hook Form, Zod       | Validación                 |

## 📊 Flujo de Procesamiento de Datos

* **Archivos CSV**: `labor.csv`, `population.csv`, `predictions.csv`, `geo_data.csv`
* **Tabla Supabase**: `labor`
* **Hooks de procesamiento**: `useCSVData`, `processRegionalData`, `processTimeSeriesData`, etc.

![Flujo de datos y visualización](docs/img/data-processing-pipeline.png)

## 🔐 Gestión de Usuarios y Autenticación

Implementa acceso por niveles:

| Plan   | Precio   | Acceso                        |
| ------ | -------- | ----------------------------- |
| Free   | \$0/mes  | Vista básica                  |
| Silver | \$29/mes | Dashboards interactivos       |
| Gold   | \$99/mes | Analítica completa + reportes |

### Componentes Clave

* `AuthPage`: Inicio de sesión y registro
* `useAuth`: Sesión
* `useProfile`: Nivel de acceso

![Autenticación y control de acceso](docs/img/authentication-flow.png)

## 🧭 Secciones del Dashboard

| Sección     | Componente           | Propósito                    | Características                  |
| ----------- | -------------------- | ---------------------------- | -------------------------------- |
| Dashboard   | `SimpleReports`      | Análisis de datos históricos | Gráficos, tendencias, demografía |
| Reports     | `ReportsSection`     | Exportación                  | PDF/CSV                          |
| Predictions | `PredictionsReports` | Mapas de predicción          | Visuales interactivos            |

## ⚙️ Desarrollo y Configuración

* Usa Vite para desarrollo rápido
* Configuración con TypeScript
* Scripts de desarrollo, producción y preview en `package.json`

## 👥 Contribuyentes

* Atenea Rojas
* Angélica Portocarrero
* Juan Granados




## Project info

**URL**: https://lovable.dev/projects/75e53b15-1345-4963-9c5d-3cc3b87e149d

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/75e53b15-1345-4963-9c5d-3cc3b87e149d) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/75e53b15-1345-4963-9c5d-3cc3b87e149d) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

