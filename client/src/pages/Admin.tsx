import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';

export const AdminPanel = () => {
    return (
        <div className="container py-8">
            <h1 className="text-3xl font-bold mb-8">Admin Panel</h1>
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Manage Trains</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>Add, edit, or remove train schedules.</p>
                        {/* CRUD Form would go here */}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Manage Stations</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>Configure station GPS coordinates.</p>
                        {/* CRUD Form would go here */}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
