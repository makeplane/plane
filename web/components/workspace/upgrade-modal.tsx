import { FC, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
// icons
import { Check } from "lucide-react";
import useSWR from "swr";
// services
import { LicenseService } from "services/license.service";
const licenseService = new LicenseService();

export interface IUpgradeWorkspaceModal {
  isOpen: boolean;
  handleClose: () => void;
}

export const UpgradeWorkspaceModal: FC<IUpgradeWorkspaceModal> = (props) => {
  const { isOpen, handleClose } = props;

  const { data: products } = useSWR("UPGRADE_PRODUCTS", () => licenseService.getProducts());

  console.log("products", products);

  return (
    <>
      <Transition.Root show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={handleClose}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-custom-backdrop bg-opacity-50 transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-20 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all sm:w-3/5 lg:w-1/2 xl:w-2/5">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                    Upgrade your plan
                  </Dialog.Title>
                  <div className="mx-auto max-w-4xl">
                    <div className="mx-auto mt-10 grid max-w-md grid-cols-1 gap-8 lg:mx-0 lg:max-w-none lg:grid-cols-2">
                      {products?.map((product: any) => (
                        <div
                          key={product.id}
                          className={`${
                            product?.mostPopular ? "ring-2 ring-[#3e76fe]" : "ring-1 ring-gray-200"
                          } rounded-3xl p-8 xl:p-10`}
                        >
                          <div className="flex items-center justify-between gap-x-4">
                            <h3
                              id={product.id}
                              className={`${
                                product?.mostPopular ? "text-[#3e76fe]" : "text-gray-900"
                              } text-lg font-semibold leading-8`}
                            >
                              {product.name}
                            </h3>
                            {product?.mostPopular ? (
                              <p className="rounded-full bg-[#3e76fe]/10 px-2.5 py-1 text-xs font-semibold leading-5 text-[#3e76fe]">
                                Most popular
                              </p>
                            ) : null}
                          </div>
                          <p className="mt-4 text-sm leading-6 text-gray-600">{product.description}</p>
                          <p className="mt-6 flex items-baseline gap-x-1">
                            <span className="text-4xl font-bold tracking-tight text-gray-900">
                              {product.default_price.price}
                            </span>
                            <span className="text-sm font-semibold leading-6 text-gray-600" />
                          </p>
                          <a
                            className={`${
                              product?.mostPopular
                                ? "bg-[#3e76fe] text-white shadow-sm hover:bg-indigo-500"
                                : "text-[#3e76fe] ring-1 ring-inset ring-indigo-200 hover:ring-indigo-300"
                            } mt-6 block rounded-md px-3 py-2 text-center text-sm font-semibold leading-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3e76fe]`}
                          >
                            Upgrade
                          </a>
                          <ul role="list" className="mt-8 space-y-3 text-sm leading-6 text-gray-600 xl:mt-10">
                            {product.features?.map((feature: any) => (
                              <li key={feature.name} className="flex gap-x-3">
                                <Check className="h-6 w-5 flex-none text-[#3e76fe]" aria-hidden="true" />
                                {feature.name}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </>
  );
};
