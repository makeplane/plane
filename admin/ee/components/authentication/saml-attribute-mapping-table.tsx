export const SAMLAttributeMappingTable = () => (
  <table className="table-auto border-collapse text-custom-text-200 text-sm">
    <thead>
      <tr className="text-left">
        <th className="border-b border-r border-custom-border-300 px-4 py-1.5">IdP</th>
        <th className="border-b border-custom-border-300 px-4 py-1.5">Plane</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td className="border-t border-r border-custom-border-300 px-4 py-1.5">Name ID format</td>
        <td className="border-t border-custom-border-300 px-4 py-1.5">emailAddress</td>
      </tr>
      <tr>
        <td className="border-t border-r border-custom-border-300 px-4 py-1.5">first_name</td>
        <td className="border-t border-custom-border-300 px-4 py-1.5">user.firstName</td>
      </tr>
      <tr>
        <td className="border-t border-r border-custom-border-300 px-4 py-1.5">last_name</td>
        <td className="border-t border-custom-border-300 px-4 py-1.5">user.lastName</td>
      </tr>
      <tr>
        <td className="border-t border-r border-custom-border-300 px-4 py-1.5">email</td>
        <td className="border-t border-custom-border-300 px-4 py-1.5">user.email</td>
      </tr>
    </tbody>
  </table>
);
