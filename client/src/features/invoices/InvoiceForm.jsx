import { useForm, useWatch, FormProvider} from "react-hook-form";
import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";

import ValidatedTextarea from "../../components/ValidateTextarea";
import ValidateSelectInput from "../../components/ValidateSelectInput";
import ValidateRadioGroup from "../../components/ValidateRadioGroup";
import ValidateCheckboxGroup from "../../components/ValidateCheckboxGroup";
import formatDate from "../../utils/formatDate";
import ValidateSupplierInput from "../../components/ValidateSupplierInput";
import ValidatedCodeInput from "../../components/ValidatedCodeInput";
import ValidatedAmountInput from "../../components/ValidatedAmountInput";
import ValidateDateInput from "../../components/ValidateDateInput";
import FormContainer from "../../components/FormContainer";
import FormSection from "../../components/FormSection";
import AsyncSubmitBtn from "../../components/AsyncSubmitBtn";
import { invoiceSchema } from "./InvoiceShema";
import useToastFeedback from "../../hooks/useToastFeedBack";
import useDateValidation from "../../hooks/useDateValidation";

function InvoiceForm() {

  const methods = useForm({
    resolver: zodResolver(invoiceSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    shouldFocusError: true,
    criteriaMode: "all",
    defaultValues: {
      invoice_date: formatDate(),
      invoice_arrival_date: formatDate(),
      invoice_num: "",
      num_cmdt: ""
    }
  });
  
  const { control, trigger } = methods;  
  const invoiceDate = useWatch({ control, name: "invoice_date" });
  const arrivalDate = useWatch({ control, name: "invoice_arrival_date" });

  const { success } = useToastFeedback();
  const { validateDateOrder } = useDateValidation();

  // Effet pour la validation croisée des dates
  useEffect(() => {
    if (invoiceDate && arrivalDate) {
      // Laisser Zod faire sa validation
      trigger("invoice_arrival_date");
      
      // Ajouter un warning discret pour l'incohérence des dates
      validateDateOrder(invoiceDate, arrivalDate, {
        showWarning: true,
        cooldownMs: 5000,
        fieldNames: {
          invoice: "Date de la facture",
          arrival: "Date d'arrivée du courrier"
        }
      });
    }
  }, [invoiceDate, arrivalDate, trigger, validateDateOrder])
  const [loading, setLoading] = useState(false);
  
  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await new Promise((res) => setTimeout(res, 2000)); // Simulation de l'envoie
      success("Facture envoyée avec succès");
      console.log(data);
    } finally {
      setLoading(false);
    }
  };
  return (
    <FormProvider {...methods}>
      <FormContainer handleSubmit={methods.handleSubmit} onSubmit={onSubmit}>
          <FormSection>
          <ValidatedCodeInput name="invoice_num" label="Numéro de la facture" placeholder="XXXX"/>
          <ValidatedCodeInput name="num_cmdt" label="N° CMDT courrier" placeholder="XXXX"/>
          <ValidateDateInput name={"invoice_date"}  label={'Date de la facture'}  placeholder={'JJ/MM/AAAA'} />
          <ValidateDateInput name={'invoice_arrival_date'} label={'Date d\'arrivée du courrier'} placeholder={'JJ/MM/AAAA'} />
          <ValidatedAmountInput />
          <ValidateSelectInput name="invoice_type" label={"Type de la facture"} 
            option={
              [
                {name: "Ordinaire", value: "Ordinaire"}, 
                {name: "Transporteur", value: "Transporteur"}, 
                {name: "Transitaire", value: "Transitaire"}
              ]
            }
            />
            <ValidateSupplierInput />
            <ValidateSelectInput 
              label={"Folio"} 
              name="folio" 
              option={
                [
                  {name: "1 copie", value: "1 copie"},
                  {name: "Orig + 1 copie", value:  "Orig + 1 copie"}, 
                  {name: "Orig + 2 copies", value: "Orig + 2 copies"}, 
                  {name: "Orig + 3 copies", value: "Orig + 3 copies"}
                ]
              }
            />
            <ValidateRadioGroup 
            name={'invoice_status'} 
            option={
              [
                {name: "Oui", value: "Oui"}, 
                {name: "Non", value: "Non"}
              ]
            }
            />
          </FormSection>
          <FormSection>
            <ValidatedTextarea 
            label={"Objet de la facture"} 
            placeholder={"Achat de pexticides"} 
            name={"invoice_object"}
            strictMode={true}
            />
            <ValidateSelectInput 
              label={"Nature de la facture"}
              name="invoice_nature" 
              option={
                [
                  {name: "Paiement", value: "Paiement"}, 
                  {name: "Acompte", value: "Acompte"}, 
                  {name: "Avoir", value: "Avoir"}
                ]
              }
            />
          </FormSection>
          <FormSection>
            <ValidateCheckboxGroup 
              option={
                [
                  {name: "Connaissement", value: "Connaissement"},
                  {name: "Attestation de prise en charge", value: "Attestation de prise en charge"},
                  {name: "Lettre de voiture Inter-Etats", value: "Lettre de voiture Inter-Etats"}
                ]
              }
              name={"documents"}
            />
          </FormSection>
          <AsyncSubmitBtn label="Envoyer à la DFC" loadingLabel="Transmission en cours..." loading={loading} />
      </FormContainer>
    </FormProvider>
  )
}

export default InvoiceForm;