import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { ownerEquipmentService, categoryService, uploadService } from '../../services';
import { Button, Input, Select, Textarea, FormRow, SectionHeader } from '../../components/ui';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import { CheckCircle, Upload, X, ArrowLeft, ArrowRight, Image as ImageIcon, FileText } from 'lucide-react';
import clsx from 'clsx';
// IMPORTANT: Backend only accepts these conditions
const CONDITIONS = ['excellent', 'good', 'fair']; // Removed 'poor' and 'new'
const CITIES = ['Addis Ababa', 'Dire Dawa', 'Hawassa', 'Bahir Dar', 'Mekelle', 'Adama', 'Gondar', 'Jimma', 'Dessie', 'Jijiga'];
export default function OwnerAddEquipment() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [docs, setDocs] = useState([]);
  const [docPreviews, setDocPreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const STEPS = [
    t('ownerEquipment.steps.basicInfo'),
    t('ownerEquipment.steps.details'),
    t('ownerEquipment.steps.pricing'),
    t('ownerEquipment.steps.location'),
    t('ownerEquipment.steps.media')
  ];
  const { register, handleSubmit, formState: { errors }, watch, trigger, setValue, getValues } = useForm({
    defaultValues: {
      name: '',
      brand: '',
      model: '',
      year: '',
      condition: '',
      category_id: '',
      description: '',
      specifications: {},
      attachments: '',
      price_per_hour: '',
      price_per_day: '',
      price_per_week: '',
      price_per_month: '',
      deposit_required: '',
      min_rental_days: 1,
      available_from: '',
      available_to: '',
      city: '',
      specific_address: '',
      delivery_available: false,
      delivery_radius_km: '',
    }
  });
  useEffect(() => {
    loadCategories();
    // Cleanup previews on unmount
    return () => {
      imagePreviews.forEach(preview => URL.revokeObjectURL(preview));
    };
  }, []);
  const loadCategories = async () => {
    try {
      const response = await categoryService.getAll({ active: true });
      let categoriesData = response.data?.data || response.data || [];
      if (Array.isArray(categoriesData)) {
        setCategories(categoriesData);
      } else if (categoriesData.data && Array.isArray(categoriesData.data)) {
        setCategories(categoriesData.data);
      } else {
        setCategories([]);
      }
    } catch (err) {
      toast.error(t('ownerEquipment.errors.loadCategories'));
    } finally {
      setCategoriesLoading(false);
    }
  };
  // Handle image dropzone
  const { getRootProps: getImgProps, getInputProps: getImgInput } = useDropzone({
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    multiple: true,
    maxFiles: 10,
    maxSize: 10 * 1024 * 1024,
    onDrop: (acceptedFiles, rejectedFiles) => {
      if (rejectedFiles.length > 0) {
        rejectedFiles.forEach(file => {
          if (file.errors[0].code === 'file-too-large') {
            toast.error(t('ownerEquipment.errors.fileTooLarge', { name: file.file.name, max: '10MB' }));
          } else if (file.errors[0].code === 'file-invalid-type') {
            toast.error(t('ownerEquipment.errors.invalidImageType', { name: file.file.name }));
          }
        });
      }
      if (acceptedFiles.length > 0) {
        const newImages = [...images, ...acceptedFiles].slice(0, 10);
        setImages(newImages);
        const newPreviews = acceptedFiles.map(file => URL.createObjectURL(file));
        setImagePreviews(prev => [...prev, ...newPreviews].slice(0, 10));
        toast.success(t('ownerEquipment.success.imagesAdded', { count: acceptedFiles.length }));
      }
    },
  });
  // Handle document dropzone
  const { getRootProps: getDocProps, getInputProps: getDocInput } = useDropzone({
    accept: { 
      'application/pdf': ['.pdf'],
      'image/*': ['.jpeg', '.jpg', '.png']
    },
    multiple: true,
    maxFiles: 5,
    maxSize: 20 * 1024 * 1024,
    onDrop: (acceptedFiles, rejectedFiles) => {
      if (rejectedFiles.length > 0) {
        rejectedFiles.forEach(file => {
          if (file.errors[0].code === 'file-too-large') {
            toast.error(t('ownerEquipment.errors.fileTooLarge', { name: file.file.name, max: '20MB' }));
          } else {
            toast.error(t('ownerEquipment.errors.invalidDocumentType', { name: file.file.name }));
          }
        });
      }
      if (acceptedFiles.length > 0) {
        const newDocs = [...docs, ...acceptedFiles].slice(0, 5);
        setDocs(newDocs);
        const newPreviews = acceptedFiles.map(file => ({
          name: file.name,
          type: file.type,
          size: file.size
        }));
        setDocPreviews(prev => [...prev, ...newPreviews].slice(0, 5));
        toast.success(t('ownerEquipment.success.documentsAdded', { count: acceptedFiles.length }));
      }
    },
  });
  const validateStep = async () => {
    let fieldsToValidate = [];
    if (step === 0) {
      fieldsToValidate = ['name', 'brand', 'model', 'condition', 'category_id'];
    } else if (step === 1) {
      fieldsToValidate = ['description'];
    } else if (step === 2) {
      fieldsToValidate = ['price_per_day'];
    } else if (step === 3) {
      fieldsToValidate = ['city'];
    } else if (step === 4) {
      if (images.length === 0) {
        toast.error(t('ownerEquipment.errors.noImages'));
        return false;
      }
      return true;
    }
    const isValid = await trigger(fieldsToValidate);
    return isValid;
  };
  const saveStep = async (data) => {
    const isValid = await validateStep();
    if (!isValid) {
      return;
    }
    if (step < STEPS.length - 1) {
      setStep(s => s + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      await submitAll(data);
    }
  };
  const uploadImages = async (files) => {
    if (!files.length) return [];
    try {
      const response = await uploadService.multiple(files, 'image');
      if (response.data?.data?.urls) {
        return response.data.data.urls;
      } else if (response.data?.urls) {
        return response.data.urls;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        return response.data.data;
      } else if (Array.isArray(response.data)) {
        return response.data;
      }
      return [];
    } catch (error) {
      throw new Error(t('ownerEquipment.errors.uploadImagesFailed'));
    }
  };
  const uploadDocuments = async (files) => {
    if (!files.length) return [];
    try {
      const response = await uploadService.multiple(files, 'document');
      if (response.data?.data?.urls) {
        return response.data.data.urls;
      } else if (response.data?.urls) {
        return response.data.urls;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        return response.data.data;
      } else if (Array.isArray(response.data)) {
        return response.data;
      }
      return [];
    } catch (error) {
      throw new Error(t('ownerEquipment.errors.uploadDocumentsFailed'));
    }
  };
  const submitAll = async (allData) => {
    setSubmitting(true);
    try {
      let imageUrls = [];
      let docUrls = [];
      if (images.length > 0) {
        setUploading(true);
        toast.loading(t('ownerEquipment.uploading.images'), { id: 'upload-images' });
        imageUrls = await uploadImages(images);
        toast.dismiss('upload-images');
        toast.success(t('ownerEquipment.success.imagesUploaded', { count: imageUrls.length }));
      }
      if (docs.length > 0) {
        setUploading(true);
        toast.loading(t('ownerEquipment.uploading.documents'), { id: 'upload-docs' });
        docUrls = await uploadDocuments(docs);
        toast.dismiss('upload-docs');
        if (docUrls.length > 0) {
          toast.success(t('ownerEquipment.success.documentsUploaded', { count: docUrls.length }));
        }
      }
      setUploading(false);
      if (!allData.category_id) {
        toast.error(t('ownerEquipment.errors.selectCategory'));
        setSubmitting(false);
        return;
      }
      // Build specifications object
      const specifications = {};
      if (allData.specifications) {
        Object.keys(allData.specifications).forEach(key => {
          if (allData.specifications[key]) {
            specifications[key] = allData.specifications[key];
          }
        });
      }
      // Ensure attachments is always an array
      let attachments = [];
      if (allData.attachments) {
        if (Array.isArray(allData.attachments)) {
          attachments = allData.attachments;
        } else if (typeof allData.attachments === 'string' && allData.attachments.trim()) {
          attachments = allData.attachments
            .split(',')
            .map(s => s.trim())
            .filter(s => s !== '');
        }
      }
      // CRITICAL FIX: Convert all values to match backend expectations
      const payload = {
        name: allData.name?.trim(),
        brand: allData.brand?.trim(),
        model: allData.model?.trim() || undefined, // Use undefined instead of null
        year: allData.year ? parseInt(allData.year) : undefined,
        condition: allData.condition || undefined,
        description: allData.description?.trim() || undefined,
        category_id: allData.category_id,
        specifications: Object.keys(specifications).length > 0 ? specifications : {},
        attachments: attachments,
        images: imageUrls,
        documents: docUrls,
        // IMPORTANT: price_per_day must be a number and is required
        price_per_day: parseFloat(allData.price_per_day),
        price_per_hour: allData.price_per_hour ? parseFloat(allData.price_per_hour) : undefined,
        price_per_week: allData.price_per_week ? parseFloat(allData.price_per_week) : undefined,
        price_per_month: allData.price_per_month ? parseFloat(allData.price_per_month) : undefined,
        deposit_required: allData.deposit_required ? parseFloat(allData.deposit_required) : 0,
        min_rental_days: allData.min_rental_days ? parseInt(allData.min_rental_days) : 1,
        available_from: allData.available_from || undefined,
        available_to: allData.available_to || undefined,
        city: allData.city,
        specific_address: allData.specific_address?.trim() || undefined,
        // Convert string 'true'/'false' to actual boolean
        delivery_available: allData.delivery_available === true || allData.delivery_available === 'true',
        delivery_radius_km: allData.delivery_radius_km ? parseFloat(allData.delivery_radius_km) : undefined,
      };
      // Remove undefined values to avoid sending them
      Object.keys(payload).forEach(key => {
        if (payload[key] === undefined) {
          delete payload[key];
        }
      });
      const response = await ownerEquipmentService.create(payload);
      toast.success(t('ownerEquipment.success.submitted'));
      navigate('/owner/submissions');
    } catch (error) {
      if (error.response) {
        // Try to get validation errors from response
        if (error.response.data && typeof error.response.data === 'object') {
        }
      }
      let errorMessage = t('ownerEquipment.errors.submissionFailed');
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.errors) {
        if (Array.isArray(error.response.data.errors)) {
          errorMessage = error.response.data.errors
            .map(err => err.msg || err.message || JSON.stringify(err))
            .join(', ');
        } else if (typeof error.response.data.errors === 'object') {
          errorMessage = Object.entries(error.response.data.errors)
            .map(([field, msgs]) => `${field}: ${msgs.join(', ')}`)
            .join('; ');
        }
      }
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };
  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    URL.revokeObjectURL(imagePreviews[index]);
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
    toast.success(t('ownerEquipment.success.imageRemoved'));
  };
  const removeDocument = (index) => {
    setDocs(prev => prev.filter((_, i) => i !== index));
    setDocPreviews(prev => prev.filter((_, i) => i !== index));
    toast.success(t('ownerEquipment.success.documentRemoved'));
  };
  const goBack = () => {
    if (step > 0) {
      setStep(s => s - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  const getConditionLabel = (condition) => {
    const labels = {
      excellent: t('equipment.conditions.excellent'),
      good: t('equipment.conditions.good'),
      fair: t('equipment.conditions.fair'),
    };
    return labels[condition] || condition;
  };
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <SectionHeader 
        title={t('ownerEquipment.title')} 
        subtitle={t('ownerEquipment.subtitle')} 
      />
      {/* Step Indicators */}
      <div className="flex items-center gap-0">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center flex-1 last:flex-none">
            <div className={clsx('flex items-center gap-2 shrink-0')}>
              <div className={clsx('w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all',
                i < step ? 'bg-green-500 text-white' : i === step ? 'bg-brand-500 text-white' : 'bg-[var(--bg-secondary)] text-[var(--text-muted)] border border-[var(--border)]')}
                style={{ fontFamily: 'Syne,sans-serif' }}>
                {i < step ? <CheckCircle className="w-4 h-4" /> : i + 1}
              </div>
              <span className={clsx('text-xs font-medium hidden sm:block', i === step ? 'text-[var(--text)]' : 'text-[var(--text-muted)]')}>{s}</span>
            </div>
            {i < STEPS.length - 1 && <div className={clsx('flex-1 h-0.5 mx-2', i < step ? 'bg-green-500' : 'bg-[var(--border)]')} />}
          </div>
        ))}
      </div>
      <div className="card p-6">
        <form onSubmit={handleSubmit(saveStep)}>
          {/* Step 0 - Basic Info */}
          {step === 0 && (
            <div className="space-y-4 animate-fade-in">
              <h2 className="section-title">{t('ownerEquipment.basicInfo.title')}</h2>
              <Input 
                label={t('ownerEquipment.basicInfo.name')}
                placeholder={t('ownerEquipment.basicInfo.namePlaceholder')}
                error={errors.name?.message}
                {...register('name', { 
                  required: t('ownerEquipment.validation.nameRequired'),
                  minLength: { value: 3, message: t('ownerEquipment.validation.nameMinLength') }
                })} 
              />
              <FormRow>
                <Input 
                  label={t('ownerEquipment.basicInfo.brand')}
                  placeholder={t('ownerEquipment.basicInfo.brandPlaceholder')}
                  error={errors.brand?.message}
                  {...register('brand', { 
                    required: t('ownerEquipment.validation.brandRequired')
                  })} 
                />
                <Input 
                  label={t('ownerEquipment.basicInfo.model')}
                  placeholder={t('ownerEquipment.basicInfo.modelPlaceholder')}
                  error={errors.model?.message}
                  {...register('model', { 
                    required: t('ownerEquipment.validation.modelRequired')
                  })} 
                />
              </FormRow>
              <FormRow>
                <Input 
                  label={t('ownerEquipment.basicInfo.year')}
                  type="number" 
                  placeholder="2022" 
                  min="1990" 
                  max={new Date().getFullYear()}
                  error={errors.year?.message}
                  {...register('year', {
                    min: { value: 1990, message: t('ownerEquipment.validation.yearMin') },
                    max: { value: new Date().getFullYear(), message: t('ownerEquipment.validation.yearMax') }
                  })} 
                />
                <Select 
                  label={t('ownerEquipment.basicInfo.condition')}
                  error={errors.condition?.message}
                  {...register('condition', { 
                    required: t('ownerEquipment.validation.conditionRequired')
                  })}
                >
                  <option value="">{t('ownerEquipment.basicInfo.selectCondition')}</option>
                  {CONDITIONS.map(c => (
                    <option key={c} value={c}>
                      {getConditionLabel(c)}
                    </option>
                  ))}
                </Select>
              </FormRow>
              <Select 
                label={t('ownerEquipment.basicInfo.category')}
                error={errors.category_id?.message}
                {...register('category_id', { 
                  required: t('ownerEquipment.validation.categoryRequired')
                })}
              >
                <option value="">{t('ownerEquipment.basicInfo.selectCategory')}</option>
                {categoriesLoading ? (
                  <option disabled>{t('common.loading')}</option>
                ) : (
                  categories.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.icon} {c.name}
                    </option>
                  ))
                )}
              </Select>
            </div>
          )}
          {/* Step 1 - Details */}
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <h2 className="section-title">{t('ownerEquipment.details.title')}</h2>
              <Textarea 
                label={t('ownerEquipment.details.description')}
                placeholder={t('ownerEquipment.details.descriptionPlaceholder')}
                rows={4}
                error={errors.description?.message} 
                {...register('description', { 
                  required: t('ownerEquipment.validation.descriptionRequired'),
                  minLength: { value: 20, message: t('ownerEquipment.validation.descriptionMinLength') },
                  maxLength: { value: 2000, message: t('ownerEquipment.validation.descriptionMaxLength') }
                })} 
              />
              <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider pt-2" style={{ fontFamily: 'Syne,sans-serif' }}>
                {t('ownerEquipment.details.specifications')}
              </p>
              <FormRow>
                <Input 
                  label={t('ownerEquipment.details.weight')}
                  placeholder={t('ownerEquipment.details.weightPlaceholder')}
                  {...register('specifications.weight')} 
                />
                <Input 
                  label={t('ownerEquipment.details.engine')}
                  placeholder={t('ownerEquipment.details.enginePlaceholder')}
                  {...register('specifications.engine')} 
                />
              </FormRow>
              <FormRow>
                <Input 
                  label={t('ownerEquipment.details.power')}
                  placeholder={t('ownerEquipment.details.powerPlaceholder')}
                  {...register('specifications.power')} 
                />
                <Input 
                  label={t('ownerEquipment.details.maxReach')}
                  placeholder={t('ownerEquipment.details.maxReachPlaceholder')}
                  {...register('specifications.max_reach')} 
                />
              </FormRow>
              <Input 
                label={t('ownerEquipment.details.attachments')}
                placeholder={t('ownerEquipment.details.attachmentsPlaceholder')}
                {...register('attachments')} 
              />
            </div>
          )}
          {/* Step 2 - Pricing */}
          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <h2 className="section-title">{t('ownerEquipment.pricing.title')}</h2>
              <p className="text-sm text-[var(--text-secondary)]">{t('ownerEquipment.pricing.description')}</p>
              <FormRow>
                <Input 
                  label={t('ownerEquipment.pricing.perHour')}
                  type="number" 
                  placeholder="1200" 
                  min="0"
                  step="0.01"
                  {...register('price_per_hour', {
                    min: { value: 0, message: t('ownerEquipment.validation.priceNegative') }
                  })} 
                />
                <Input 
                  label={t('ownerEquipment.pricing.perDay')}
                  type="number" 
                  placeholder="8500" 
                  min="0"
                  step="0.01"
                  error={errors.price_per_day?.message}
                  {...register('price_per_day', { 
                    required: t('ownerEquipment.validation.dailyPriceRequired'),
                    min: { value: 0.01, message: t('ownerEquipment.validation.pricePositive') },
                    valueAsNumber: true
                  })} 
                />
              </FormRow>
              <FormRow>
                <Input 
                  label={t('ownerEquipment.pricing.perWeek')}
                  type="number" 
                  placeholder="50000" 
                  min="0"
                  step="0.01"
                  {...register('price_per_week', {
                    min: { value: 0, message: t('ownerEquipment.validation.priceNegative') }
                  })} 
                />
                <Input 
                  label={t('ownerEquipment.pricing.perMonth')}
                  type="number" 
                  placeholder="180000" 
                  min="0"
                  step="0.01"
                  {...register('price_per_month', {
                    min: { value: 0, message: t('ownerEquipment.validation.priceNegative') }
                  })} 
                />
              </FormRow>
              <FormRow>
                <Input 
                  label={t('ownerEquipment.pricing.deposit')}
                  type="number" 
                  placeholder="10000" 
                  min="0"
                  step="0.01"
                  {...register('deposit_required', {
                    min: { value: 0, message: t('ownerEquipment.validation.depositNegative') }
                  })} 
                />
                <Input 
                  label={t('ownerEquipment.pricing.minRentalDays')}
                  type="number" 
                  placeholder="1" 
                  min="1"
                  error={errors.min_rental_days?.message}
                  {...register('min_rental_days', {
                    min: { value: 1, message: t('ownerEquipment.validation.minRentalDaysMin') }
                  })} 
                />
              </FormRow>
              <FormRow>
                <Input 
                  label={t('ownerEquipment.pricing.availableFrom')}
                  type="date" 
                  {...register('available_from')} 
                />
                <Input 
                  label={t('ownerEquipment.pricing.availableTo')}
                  type="date" 
                  {...register('available_to')} 
                />
              </FormRow>
            </div>
          )}
          {/* Step 3 - Location */}
          {step === 3 && (
            <div className="space-y-4 animate-fade-in">
              <h2 className="section-title">{t('ownerEquipment.location.title')}</h2>
              <Select 
                label={t('ownerEquipment.location.city')}
                error={errors.city?.message} 
                {...register('city', { 
                  required: t('ownerEquipment.validation.cityRequired')
                })}
              >
                <option value="">{t('ownerEquipment.location.selectCity')}</option>
                {CITIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
              <Input 
                label={t('ownerEquipment.location.address')}
                placeholder={t('ownerEquipment.location.addressPlaceholder')}
                {...register('specific_address')} 
              />
              <Select 
                label={t('ownerEquipment.location.deliveryAvailable')}
                {...register('delivery_available')}
              >
                <option value="false">{t('ownerEquipment.location.noDelivery')}</option>
                <option value="true">{t('ownerEquipment.location.yesDelivery')}</option>
              </Select>
              {watch('delivery_available') === 'true' && (
                <Input 
                  label={t('ownerEquipment.location.deliveryRadius')}
                  type="number" 
                  placeholder="30" 
                  min="0"
                  step="0.01"
                  {...register('delivery_radius_km', {
                    min: { value: 0, message: t('ownerEquipment.validation.radiusNegative') }
                  })} 
                />
              )}
            </div>
          )}
          {/* Step 4 - Media */}
          {step === 4 && (
            <div className="space-y-5 animate-fade-in">
              <h2 className="section-title">{t('ownerEquipment.media.title')}</h2>
              {/* Images Upload */}
              <div>
                <label className="label flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" />
                  {t('ownerEquipment.media.photos')}
                </label>
                <div {...getImgProps()} className="border-2 border-dashed border-[var(--border)] hover:border-brand-500 rounded-xl p-8 text-center cursor-pointer transition-colors bg-[var(--bg-secondary)]">
                  <input {...getImgInput()} />
                  <Upload className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-2" />
                  <p className="text-sm text-[var(--text-secondary)]">
                    {t('ownerEquipment.media.dragDropImages')}{' '}
                    <span className="text-brand-500 font-semibold">{t('ownerEquipment.media.clickToBrowse')}</span>
                  </p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">{t('ownerEquipment.media.imageConstraints')}</p>
                </div>
                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 mt-3">
                    {imagePreviews.map((preview, i) => (
                      <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-[var(--border)] group bg-[var(--bg-secondary)]">
                        <img src={preview} alt={`${t('ownerEquipment.media.preview')} ${i + 1}`} className="w-full h-full object-cover" />
                        <button 
                          type="button" 
                          onClick={() => removeImage(i)}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {/* Documents Upload */}
              <div>
                <label className="label flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  {t('ownerEquipment.media.documents')}
                </label>
                <div {...getDocProps()} className="border-2 border-dashed border-[var(--border)] hover:border-brand-500 rounded-xl p-6 text-center cursor-pointer transition-colors bg-[var(--bg-secondary)]">
                  <input {...getDocInput()} />
                  <Upload className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-2" />
                  <p className="text-sm text-[var(--text-secondary)]">
                    {t('ownerEquipment.media.dragDropDocuments')}{' '}
                    <span className="text-brand-500 font-semibold">{t('ownerEquipment.media.clickToBrowse')}</span>
                  </p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">{t('ownerEquipment.media.documentConstraints')}</p>
                </div>
                {docPreviews.length > 0 && (
                  <div className="space-y-2 mt-3">
                    {docPreviews.map((doc, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <FileText className="w-4 h-4 text-[var(--text-muted)] flex-shrink-0" />
                          <span className="text-sm text-[var(--text)] truncate">{doc.name}</span>
                          <span className="text-xs text-[var(--text-muted)] flex-shrink-0">
                            ({(doc.size / 1024).toFixed(1)} KB)
                          </span>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => removeDocument(i)}
                          className="text-red-500 hover:text-red-600 transition-colors flex-shrink-0 ml-2"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <p className="text-xs text-blue-600 dark:text-blue-400 text-center">
                  {t('ownerEquipment.media.infoText')}
                </p>
              </div>
            </div>
          )}
          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-[var(--border)]">
            <Button 
              type="button" 
              variant="secondary" 
              onClick={goBack} 
              disabled={step === 0 || submitting || uploading}
            >
              <ArrowLeft className="w-4 h-4" /> {t('ownerEquipment.navigation.back')}
            </Button>
            <Button 
              type="submit" 
              loading={submitting || uploading}
              disabled={submitting || uploading}
            >
              {step === STEPS.length - 1 ? (
                submitting ? t('common.loading') : t('ownerEquipment.navigation.submit')
              ) : (
                <>
                  {t('ownerEquipment.navigation.continue')}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}