import { LoginForm } from "../../components/LoginForm";

/**
 * En la aplicación real esta página consulta la sesión en el servidor y redirige. Aquí solo
 * dibuja el formulario: el control de acceso vive en app/(app)/layout.tsx, del lado del cliente.
 */
export default function LoginPage() {
  return <LoginForm />;
}
